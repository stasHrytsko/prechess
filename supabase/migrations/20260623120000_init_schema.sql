-- Chess Prediction MVP — initial schema (phase 1)
-- Server-authoritative: balances and bets change only via SECURITY DEFINER RPCs.
-- Worker writes game data with the service role (bypasses RLS).

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  handle      text not null unique,
  balance     integer not null default 1000 check (balance >= 0),
  created_at  timestamptz not null default now()
);

create table if not exists public.games (
  id           uuid primary key default gen_random_uuid(),
  lichess_id   text unique,
  white_name   text not null,
  white_rating integer,
  black_name   text not null,
  black_rating integer,
  event        text,
  time_class   text,
  start_fen    text,
  status       text not null default 'live'
               check (status in ('scheduled', 'live', 'finished')),
  result       text check (result in ('white', 'black', 'draw')),
  started_at   timestamptz not null default now(),
  finished_at  timestamptz
);

create table if not exists public.markets (
  id           uuid primary key default gen_random_uuid(),
  game_id      uuid not null references public.games (id) on delete cascade,
  type         text not null default 'winner' check (type in ('winner')),
  status       text not null default 'open'
               check (status in ('open', 'closed', 'resolved')),
  winning_side text check (winning_side in ('white', 'black')),
  created_at   timestamptz not null default now(),
  resolved_at  timestamptz,
  unique (game_id, type)
);

create table if not exists public.prob_ticks (
  id          bigint generated always as identity primary key,
  game_id     uuid not null references public.games (id) on delete cascade,
  white_prob  numeric(5, 4) not null check (white_prob >= 0 and white_prob <= 1),
  eval_cp     integer,
  move_number integer,
  created_at  timestamptz not null default now()
);
create index if not exists prob_ticks_game_time_idx
  on public.prob_ticks (game_id, created_at desc);

create table if not exists public.bets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles (id) on delete cascade,
  market_id   uuid not null references public.markets (id) on delete cascade,
  side        text not null check (side in ('white', 'black')),
  stake       integer not null check (stake > 0),
  entry_prob  numeric(5, 4) not null,
  shares      numeric(12, 4) not null,
  payout      integer not null,
  status      text not null default 'open'
              check (status in ('open', 'won', 'lost', 'refunded')),
  pnl         integer,
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);
create index if not exists bets_user_idx on public.bets (user_id);
create index if not exists bets_market_idx on public.bets (market_id);

create table if not exists public.ledger (
  id            bigint generated always as identity primary key,
  user_id       uuid not null references public.profiles (id) on delete cascade,
  kind          text not null
                check (kind in ('signup_bonus', 'bet_stake', 'bet_payout', 'refund')),
  amount        integer not null,            -- signed
  balance_after integer not null,
  bet_id        uuid references public.bets (id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists ledger_user_idx on public.ledger (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles   enable row level security;
alter table public.games      enable row level security;
alter table public.markets    enable row level security;
alter table public.prob_ticks enable row level security;
alter table public.bets       enable row level security;
alter table public.ledger     enable row level security;

-- Public read for game/market data and profiles (leaderboard).
create policy "profiles are public read"   on public.profiles   for select using (true);
create policy "games are public read"       on public.games      for select using (true);
create policy "markets are public read"     on public.markets    for select using (true);
create policy "prob_ticks are public read"  on public.prob_ticks for select using (true);

-- Users see only their own bets and ledger.
create policy "own bets read"   on public.bets   for select using (auth.uid() = user_id);
create policy "own ledger read" on public.ledger for select using (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE policies anywhere: all writes go through
-- SECURITY DEFINER functions (below) or the service role (worker), which
-- bypasses RLS.

-- ---------------------------------------------------------------------------
-- New-user trigger: create profile + signup bonus
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_handle text;
begin
  v_handle := coalesce(
    nullif(new.raw_user_meta_data ->> 'handle', ''),
    'player_' || substr(new.id::text, 1, 8)
  );

  insert into public.profiles (id, handle, balance)
  values (new.id, v_handle, 1000);

  insert into public.ledger (user_id, kind, amount, balance_after)
  values (new.id, 'signup_bonus', 1000, 1000);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- place_bet — atomic, server-authoritative
-- ---------------------------------------------------------------------------

create or replace function public.place_bet(
  p_market_id uuid,
  p_side      text,
  p_stake     integer
)
returns public.bets
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid         uuid := auth.uid();
  v_balance     integer;
  v_game_id     uuid;
  v_status      text;
  v_white_prob  numeric(5, 4);
  v_side_prob   numeric(5, 4);
  v_price_cents integer;
  v_shares      numeric(12, 4);
  v_payout      integer;
  v_bet         public.bets;
begin
  if v_uid is null then
    raise exception 'not authenticated';
  end if;
  if p_side not in ('white', 'black') then
    raise exception 'invalid side: %', p_side;
  end if;
  if p_stake is null or p_stake <= 0 then
    raise exception 'stake must be positive';
  end if;

  -- Lock the user's balance row for the duration of the transaction.
  select balance into v_balance from public.profiles where id = v_uid for update;
  if v_balance is null then
    raise exception 'profile not found';
  end if;
  if v_balance < p_stake then
    raise exception 'insufficient points: balance % < stake %', v_balance, p_stake;
  end if;

  -- Market must be open.
  select game_id, status into v_game_id, v_status
  from public.markets where id = p_market_id;
  if v_game_id is null then
    raise exception 'market not found';
  end if;
  if v_status <> 'open' then
    raise exception 'market is not open (status %)', v_status;
  end if;

  -- Latest probability for the game (default 0.5 if no ticks yet).
  select white_prob into v_white_prob
  from public.prob_ticks
  where game_id = v_game_id
  order by created_at desc
  limit 1;
  v_white_prob := coalesce(v_white_prob, 0.5);

  v_side_prob   := case when p_side = 'white' then v_white_prob else 1 - v_white_prob end;
  v_price_cents := greatest(1, least(99, round(v_side_prob * 100)::integer));
  v_shares      := round(p_stake::numeric / v_price_cents, 4);
  v_payout      := round(v_shares * 100)::integer;

  update public.profiles set balance = balance - p_stake where id = v_uid;

  insert into public.bets (user_id, market_id, side, stake, entry_prob, shares, payout)
  values (v_uid, p_market_id, p_side, p_stake, v_side_prob, v_shares, v_payout)
  returning * into v_bet;

  insert into public.ledger (user_id, kind, amount, balance_after, bet_id)
  values (v_uid, 'bet_stake', -p_stake, v_balance - p_stake, v_bet.id);

  return v_bet;
end;
$$;

-- ---------------------------------------------------------------------------
-- resolve_market — service role only (called by the worker)
-- ---------------------------------------------------------------------------

create or replace function public.resolve_market(
  p_market_id uuid,
  p_result    text   -- 'white' | 'black' | 'draw'
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game_id uuid;
  r         record;
  v_balance integer;
begin
  if p_result not in ('white', 'black', 'draw') then
    raise exception 'invalid result: %', p_result;
  end if;

  select game_id into v_game_id from public.markets where id = p_market_id;
  if v_game_id is null then
    raise exception 'market not found';
  end if;

  update public.markets
  set status = 'resolved',
      winning_side = case when p_result = 'draw' then null else p_result end,
      resolved_at = now()
  where id = p_market_id;

  update public.games
  set status = 'finished', result = p_result, finished_at = now()
  where id = v_game_id;

  for r in
    select * from public.bets where market_id = p_market_id and status = 'open' for update
  loop
    if p_result = 'draw' then
      -- Refund the stake.
      update public.profiles set balance = balance + r.stake
        where id = r.user_id returning balance into v_balance;
      update public.bets set status = 'refunded', pnl = 0, resolved_at = now()
        where id = r.id;
      insert into public.ledger (user_id, kind, amount, balance_after, bet_id)
        values (r.user_id, 'refund', r.stake, v_balance, r.id);
    elsif r.side = p_result then
      -- Winner: pay out the redemption value.
      update public.profiles set balance = balance + r.payout
        where id = r.user_id returning balance into v_balance;
      update public.bets set status = 'won', pnl = r.payout - r.stake, resolved_at = now()
        where id = r.id;
      insert into public.ledger (user_id, kind, amount, balance_after, bet_id)
        values (r.user_id, 'bet_payout', r.payout, v_balance, r.id);
    else
      -- Loser: stake already deducted at placement.
      update public.bets set status = 'lost', pnl = -r.stake, resolved_at = now()
        where id = r.id;
    end if;
  end loop;
end;
$$;

-- ---------------------------------------------------------------------------
-- Function grants
-- ---------------------------------------------------------------------------

revoke all on function public.place_bet(uuid, text, integer) from public;
grant execute on function public.place_bet(uuid, text, integer) to authenticated;

revoke all on function public.resolve_market(uuid, text) from public;
grant execute on function public.resolve_market(uuid, text) to service_role;

-- ---------------------------------------------------------------------------
-- Realtime publication
-- ---------------------------------------------------------------------------

alter publication supabase_realtime add table public.prob_ticks;
alter publication supabase_realtime add table public.markets;
alter publication supabase_realtime add table public.bets;
