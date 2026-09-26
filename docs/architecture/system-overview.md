# System Overview

PreChess is a mobile-first live chess prediction market.

Target layers:

- `apps/mobile` — live board, markets, trading, positions and realtime settlement UX.
- `apps/worker` — move ingestion, canonical game state, event detection, market generation, locking and resolution.
- `packages/shared` — versioned domain contracts shared by backend and clients.
- `supabase` — persistence, realtime state, server-authoritative trading/settlement and immutable ledger.
- external chess feed — authoritative live moves.
- optional Stockfish/model services — relevance and initial-prior signals only.

The product contract is `docs/product/prediction-market.md`.
