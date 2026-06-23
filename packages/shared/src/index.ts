export type MarketSide = 'white' | 'black';

export function oppositeSide(side: MarketSide): MarketSide {
  return side === 'white' ? 'black' : 'white';
}

// ---------------------------------------------------------------------------
// Database row shapes (mirror supabase/migrations/20260623120000_init_schema.sql)
// Shared between web and worker.
// ---------------------------------------------------------------------------

export type GameStatus = 'scheduled' | 'live' | 'finished';
export type GameResult = 'white' | 'black' | 'draw';
export type MarketType = 'winner';
export type MarketStatus = 'open' | 'closed' | 'resolved';
export type BetStatus = 'open' | 'won' | 'lost' | 'refunded';
export type LedgerKind = 'signup_bonus' | 'bet_stake' | 'bet_payout' | 'refund';

export interface Profile {
  id: string;
  handle: string;
  balance: number;
  created_at: string;
}

export interface Game {
  id: string;
  lichess_id: string | null;
  white_name: string;
  white_rating: number | null;
  black_name: string;
  black_rating: number | null;
  event: string | null;
  time_class: string | null;
  start_fen: string | null;
  status: GameStatus;
  result: GameResult | null;
  started_at: string;
  finished_at: string | null;
}

export interface Market {
  id: string;
  game_id: string;
  type: MarketType;
  status: MarketStatus;
  winning_side: MarketSide | null;
  created_at: string;
  resolved_at: string | null;
}

export interface ProbTick {
  id: number;
  game_id: string;
  white_prob: number;
  eval_cp: number | null;
  move_number: number | null;
  created_at: string;
}

export interface Bet {
  id: string;
  user_id: string;
  market_id: string;
  side: MarketSide;
  stake: number;
  entry_prob: number;
  shares: number;
  payout: number;
  status: BetStatus;
  pnl: number | null;
  created_at: string;
  resolved_at: string | null;
}

export interface LedgerEntry {
  id: number;
  user_id: string;
  kind: LedgerKind;
  amount: number;
  balance_after: number;
  bet_id: string | null;
  created_at: string;
}

// ---------------------------------------------------------------------------
// Pricing (Polymarket model) — keep in sync with the place_bet RPC.
// A winning share redeems for 100 points; no house margin.
// ---------------------------------------------------------------------------

export const SHARE_REDEEM = 100;

export function clampProb(p: number): number {
  return Math.min(0.99, Math.max(0.01, p));
}

/** Price of one share in cents (¢) for a side probability. */
export function priceCents(prob: number): number {
  return Math.round(clampProb(prob) * 100);
}

/** Shares a stake buys at the given side probability. */
export function sharesFor(stake: number, prob: number): number {
  return stake / priceCents(prob);
}

/** Redemption value if the chosen side wins. */
export function payoutFor(stake: number, prob: number): number {
  return Math.round(sharesFor(stake, prob) * SHARE_REDEEM);
}
