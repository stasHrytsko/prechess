# Data Flow

```text
Live chess source
  → canonical move ingestion
  → board state + stored move
  → deterministic chess-event detector
      → resolve/continue existing markets
  → template eligibility
  → candidate market generation
  → relevance scoring
  → open selected markets
  → mobile clients receive board + prices
  → users buy/sell shares
  → server-authoritative AMM updates prices
  → realtime update to all viewers
  → next move locks affected markets
  → deterministic resolution
  → settlement + ledger
  → replacement market
```

Market selection and market pricing are separate systems.

Client clocks, client chess state and LLM output are never authoritative.
