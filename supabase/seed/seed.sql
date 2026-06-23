-- Local dev seed: public game data only (no auth users).
-- Mirrors the web mock so the UI looks the same against a real DB.
-- Run after migrations, e.g. `supabase db reset` (which applies seed automatically)
-- or `psql ... -f supabase/seed/seed.sql`.

with g as (
  insert into public.games
    (white_name, white_rating, black_name, black_rating, event, time_class, start_fen, status)
  values
    ('Магнус Карлсен', 2839, 'Хикару Накамура', 2802, 'Lichess Titled Arena', 'Блиц',
     'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R', 'live'),
    ('Фабиано Каруана', 2776, 'Дин Лижэнь', 2780, 'FIDE Grand Prix', 'Рапид',
     'r2q1rk1/pp2bppp/2n1pn2/3p4/3P4/2NBPN2/PP3PPP/R1BQ1RK1', 'live'),
    ('Алиреза Фируджа', 2760, 'Ян Непомнящий', 2771, 'Speed Chess Championship', 'Блиц',
     'rnbqkbnr/pp3ppp/4p3/2ppP3/3P4/8/PPP2PPP/RNBQKBNR', 'live'),
    ('Уэсли Со', 2757, 'Аниш Гири', 2745, 'Tata Steel Masters', 'Классика',
     '2rq1rk1/pb1nbppp/1p2pn2/8/2PP4/P1Q1PN2/1B1NBPPP/R4RK1', 'live'),
    ('Нодирбек Абдусатторов', 2766, 'Р. Прагнанандха', 2748, 'Lichess Titled Arena', 'Блиц',
     'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1', 'live')
  returning id, white_name
)
insert into public.markets (game_id, type, status)
select id, 'winner', 'open' from g;

-- One seed probability tick per game so place_bet has a price to read.
insert into public.prob_ticks (game_id, white_prob, eval_cp, move_number)
select id,
       case white_name
         when 'Магнус Карлсен' then 0.58
         when 'Фабиано Каруана' then 0.47
         when 'Алиреза Фируджа' then 0.52
         when 'Уэсли Со' then 0.63
         else 0.41
       end,
       null, 8
from public.games;
