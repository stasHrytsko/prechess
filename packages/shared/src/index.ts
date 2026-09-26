// Core PreChess domain contracts.
// Product semantics live in docs/product/prediction-market.md.

export type ChessColor = 'white' | 'black';

export type ChessEventType =
  | 'quiet_move'
  | 'capture'
  | 'check'
  | 'checkmate'
  | 'castle_kingside'
  | 'castle_queenside'
  | 'promotion'
  | 'en_passant'
  | 'queen_trade'
  | 'pawn_rank_reached'
  | 'piece_captured'
  | 'game_end';

export type MarketFamily =
  | 'game_result'
  | 'first_event'
  | 'event_within'
  | 'player_event_within'
  | 'event_before_move'
  | 'next_actor'
  | 'next_object'
  | 'race';

export type MarketStatus =
  | 'candidate'
  | 'opening'
  | 'open'
  | 'locked'
  | 'resolved'
  | 'void'
  | 'settled';

export type TradeSide = 'buy' | 'sell';

export interface MarketOutcomeSpec {
  key: string;
  label: string;
}

export interface MarketTemplate {
  id: string;
  version: number;
  family: MarketFamily;
  outcomes: MarketOutcomeSpec[];
  resolverKey: string;
  description: string;
}

export interface MarketInstance {
  id: string;
  gameId: string;
  templateId: string;
  templateVersion: number;
  startPly: number;
  horizonPlies: number | null;
  status: MarketStatus;
  parameters: Record<string, string | number | boolean | null>;
  winningOutcomeKey: string | null;
}

export interface ChessEvent {
  gameId: string;
  ply: number;
  san: string;
  fenBefore: string;
  fenAfter: string;
  events: ChessEventType[];
  occurredAt: string;
}

export interface Trade {
  id: string;
  userId: string;
  marketId: string;
  outcomeKey: string;
  side: TradeSide;
  points: number;
  shares: number;
  averagePrice: number;
  createdAt: string;
}

export interface Position {
  userId: string;
  marketId: string;
  outcomeKey: string;
  netShares: number;
  costBasis: number;
  realizedPnl: number;
}

export type ResolverResult =
  | { status: 'unresolved' }
  | { status: 'resolved'; winningOutcomeKey: string; evidencePly: number }
  | { status: 'void'; reason: string };
