// Mock data + helpers for the visual prototype.
// No backend, no real chess engine — just enough to see how the product looks.
// Pricing follows the Polymarket model: each outcome trades as "shares" priced
// in cents (¢ = implied probability). A winning share redeems for 100 points.

export type MarketSide = 'white' | 'black';

export interface ProbPoint {
  /** ms timestamp */
  t: number;
  /** White win probability, 0..1 */
  white: number;
}

export interface Bet {
  id: string;
  gameId: string;
  side: MarketSide;
  /** Points spent */
  stake: number;
  /** Implied probability (price) of chosen side at entry, 0..1 */
  entryProb: number;
  /** Number of shares bought */
  shares: number;
  /** Redemption value if the chosen side wins */
  payout: number;
  createdAt: number;
}

export interface LeaderRow {
  rank: number;
  name: string;
  points: number;
  isYou?: boolean;
}

export interface Player {
  name: string;
  rating: number;
}

export interface MockGame {
  id: string;
  white: Player;
  black: Player;
  event: string;
  /** Блиц / Рапид / Классика */
  timeClass: string;
  fen: string;
  moveNumber: number;
  /** Starting white win probability */
  startWhite: number;
  /** Points traded so far (for flavor) */
  volume: number;
}

export const MARKET_QUESTION = 'Кто победит в партии?';

export const MOCK_GAMES: MockGame[] = [
  {
    id: 'game-001',
    white: { name: 'Магнус Карлсен', rating: 2839 },
    black: { name: 'Хикару Накамура', rating: 2802 },
    event: 'Lichess Titled Arena',
    timeClass: 'Блиц',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R',
    moveNumber: 8,
    startWhite: 0.58,
    volume: 48200,
  },
  {
    id: 'game-002',
    white: { name: 'Фабиано Каруана', rating: 2776 },
    black: { name: 'Дин Лижэнь', rating: 2780 },
    event: 'FIDE Grand Prix',
    timeClass: 'Рапид',
    fen: 'r2q1rk1/pp2bppp/2n1pn2/3p4/3P4/2NBPN2/PP3PPP/R1BQ1RK1',
    moveNumber: 14,
    startWhite: 0.47,
    volume: 31750,
  },
  {
    id: 'game-003',
    white: { name: 'Алиреза Фируджа', rating: 2760 },
    black: { name: 'Ян Непомнящий', rating: 2771 },
    event: 'Speed Chess Championship',
    timeClass: 'Блиц',
    fen: 'rnbqkbnr/pp3ppp/4p3/2ppP3/3P4/8/PPP2PPP/RNBQKBNR',
    moveNumber: 5,
    startWhite: 0.52,
    volume: 22400,
  },
  {
    id: 'game-004',
    white: { name: 'Уэсли Со', rating: 2757 },
    black: { name: 'Аниш Гири', rating: 2745 },
    event: 'Tata Steel Masters',
    timeClass: 'Классика',
    fen: '2rq1rk1/pb1nbppp/1p2pn2/8/2PP4/P1Q1PN2/1B1NBPPP/R4RK1',
    moveNumber: 19,
    startWhite: 0.63,
    volume: 18900,
  },
  {
    id: 'game-005',
    white: { name: 'Нодирбек Абдусатторов', rating: 2766 },
    black: { name: 'Р. Прагнанандха', rating: 2748 },
    event: 'Lichess Titled Arena',
    timeClass: 'Блиц',
    fen: 'r1bq1rk1/ppp2ppp/2np1n2/2b1p3/2B1P3/2NP1N2/PPP2PPP/R1BQ1RK1',
    moveNumber: 7,
    startWhite: 0.41,
    volume: 12650,
  },
];

export const INITIAL_BALANCE = 1000;

/** A winning share redeems for this many points (Polymarket: $1 = 100¢). */
export const SHARE_REDEEM = 100;

export const MOCK_LEADERBOARD: LeaderRow[] = [
  { rank: 1, name: 'tactical_tim', points: 8420 },
  { rank: 2, name: 'queensac_qween', points: 7115 },
  { rank: 3, name: 'enpassant_enjoyer', points: 6680 },
  { rank: 4, name: 'you', points: INITIAL_BALANCE, isYou: true },
  { rank: 5, name: 'rookie_rook', points: 940 },
  { rank: 6, name: 'fried_liver_fan', points: 615 },
];

export const SIDE_LABEL: Record<MarketSide, string> = {
  white: 'Белые',
  black: 'Чёрные',
};

const PIECE_GLYPHS: Record<string, string> = {
  K: '♔', Q: '♕', R: '♖', B: '♗', N: '♘', P: '♙',
  k: '♚', q: '♛', r: '♜', b: '♝', n: '♞', p: '♟',
};

export interface Square {
  piece: string | null; // unicode glyph or null
  light: boolean;
}

/** Parse the piece-placement field of a FEN into 64 squares (rank 8 -> rank 1). */
export function fenToBoard(fen: string): Square[] {
  const placement = fen.split(' ')[0];
  const ranks = placement.split('/');
  const squares: Square[] = [];
  ranks.forEach((rank, rankIdx) => {
    let fileIdx = 0;
    for (const ch of rank) {
      if (/\d/.test(ch)) {
        const empty = Number(ch);
        for (let i = 0; i < empty; i += 1) {
          squares.push({ piece: null, light: (rankIdx + fileIdx) % 2 === 0 });
          fileIdx += 1;
        }
      } else {
        squares.push({ piece: PIECE_GLYPHS[ch] ?? '?', light: (rankIdx + fileIdx) % 2 === 0 });
        fileIdx += 1;
      }
    }
  });
  return squares;
}

/** Clamp helper */
export function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}

/**
 * Simulate the next live probability tick as a bounded random walk.
 * Keeps the line lively without ever pinning to 0/1.
 */
export function nextProb(current: number): number {
  const drift = (Math.random() - 0.5) * 0.06;
  return clamp(current + drift, 0.08, 0.92);
}

/** Seed a short history around a starting probability so the line isn't empty. */
export function seedHistory(start: number, points = 24, stepMs = 1500): ProbPoint[] {
  const now = Date.now();
  let w = start;
  return Array.from({ length: points }, (_, i) => {
    w = nextProb(w);
    return { t: now - (points - i) * stepMs, white: w };
  });
}

export function impliedProb(white: number, side: MarketSide): number {
  return side === 'white' ? white : 1 - white;
}

/** Price of one share in cents (¢) for the given probability. */
export function priceCents(prob: number): number {
  return Math.round(clamp(prob, 0.01, 0.99) * 100);
}

/** Number of shares a stake buys at the given probability (price). */
export function sharesFor(stake: number, prob: number): number {
  return stake / (priceCents(prob) / 100) / SHARE_REDEEM;
}

/** Redemption value if the chosen side wins (shares × 100). */
export function payoutFor(stake: number, prob: number): number {
  return Math.round(sharesFor(stake, prob) * SHARE_REDEEM);
}

export function formatPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}

export function formatCents(p: number): string {
  return `${priceCents(p)}¢`;
}

export function formatVolume(v: number): string {
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K`;
  return String(v);
}
