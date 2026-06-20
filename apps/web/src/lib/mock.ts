// Mock data + helpers for the visual prototype.
// No backend, no real chess engine — just enough to see how the product looks.

export type MarketSide = 'white' | 'black';

export interface ProbPoint {
  /** ms timestamp */
  t: number;
  /** White win probability, 0..1 */
  white: number;
}

export interface Bet {
  id: string;
  side: MarketSide;
  stake: number;
  /** Implied probability of chosen side at entry, 0..1 */
  entryProb: number;
  /** Potential payout if the chosen side wins */
  payout: number;
  createdAt: number;
}

export interface LeaderRow {
  rank: number;
  name: string;
  points: number;
  isYou?: boolean;
}

export interface MockGame {
  id: string;
  whitePlayer: string;
  blackPlayer: string;
  event: string;
  /** Starting position for the demo (mid-game, slight white edge) */
  fen: string;
  moveNumber: number;
}

export const MOCK_GAME: MockGame = {
  id: 'game-001',
  whitePlayer: 'Magnus C. (2839)',
  blackPlayer: 'Hikaru N. (2802)',
  event: 'Lichess Titled Arena · Blitz',
  // Italian-game-ish middlegame position
  fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R',
  moveNumber: 8,
};

export const INITIAL_BALANCE = 1000;

export const MOCK_LEADERBOARD: LeaderRow[] = [
  { rank: 1, name: 'tactical_tim', points: 8420 },
  { rank: 2, name: 'queensac_qween', points: 7115 },
  { rank: 3, name: 'enpassant_enjoyer', points: 6680 },
  { rank: 4, name: 'you', points: INITIAL_BALANCE, isYou: true },
  { rank: 5, name: 'rookie_rook', points: 940 },
  { rank: 6, name: 'fried_liver_fan', points: 615 },
];

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

export function impliedProb(white: number, side: MarketSide): number {
  return side === 'white' ? white : 1 - white;
}

/** Payout for a stake at given implied probability (with a small 4% house margin). */
export function payoutFor(stake: number, prob: number): number {
  const fairOdds = 1 / clamp(prob, 0.02, 0.98);
  const margin = 0.96;
  return Math.round(stake * fairOdds * margin);
}

export function formatPct(p: number): string {
  return `${(p * 100).toFixed(1)}%`;
}
