# Claude.md

This file is the working memory of PreChess. Update it whenever the product definition, architecture, MVP boundary or repository structure changes.

## 1. What we are building

PreChess is a **mobile-first live chess prediction market**.

Multiple spectators watch the same real chess game. During the game, PreChess opens short and medium-horizon markets about deterministic events that may happen soon: checks, captures, castling, queen trades and similar chess props.

Users trade outcome shares with virtual points. Crowd trading moves prices. Markets resolve automatically from the canonical move stream.

The core loop is:

`position → market → trade → watch → auto-resolve → settlement → next market`

The canonical product specification is:
`docs/product/prediction-market.md`

## 2. Product rules

1. Chess only.
2. Mobile-first.
3. Virtual points in MVP.
4. Prediction-market mechanics, not bookmaker-fixed odds.
5. Short auto-resolving props are the primary loop.
6. The game-winner market is optional/secondary.
7. Only formal, deterministic market templates may settle automatically.
8. Users do not create arbitrary free-text markets in MVP.
9. Market prices are crowd-driven through an AMM; LMSR is the leading candidate.
10. Stockfish may help assess position relevance but is not the market author or resolver.
11. Clients are never authoritative for timing, balances, trades or settlement.

## 3. Repository direction

```text
prechess/
├── claude.md
├── README.md
├── docs/
│   ├── product/
│   │   ├── prediction-market.md   # primary source of truth
│   │   ├── vision.md
│   │   ├── scope.md
│   │   └── acceptance-criteria.md
│   ├── architecture/
│   │   ├── system-overview.md
│   │   ├── data-flow.md
│   │   └── decisions.md
│   └── legal/
├── apps/
│   ├── mobile/                    # mobile client target
│   └── worker/                    # ingestion, events, market generation, resolution
├── packages/
│   └── shared/                    # domain contracts and deterministic shared types
├── supabase/                      # new schema to be designed from the new domain
└── tests/
```

The old `apps/web` winner-only mock and old winner-only Supabase schema are obsolete and intentionally removed.

## 4. Target system responsibilities

### Mobile
- live game screen;
- chess board;
- active short/medium/long markets;
- buy/sell interaction;
- user positions and P/L;
- realtime market/result updates.

### Worker/backend
- live move ingestion;
- canonical game state;
- deterministic chess event detection;
- market-template eligibility;
- candidate scoring;
- market scheduling;
- market lock timing;
- deterministic resolution;
- settlement orchestration.

### Shared
- versioned market template/domain types;
- chess event vocabulary;
- market lifecycle types;
- trade/position primitives;
- resolver contracts.

### Supabase / persistence
The new schema must support:
- games and moves/events;
- templates and template versions;
- multi-outcome markets;
- AMM state;
- trades;
- positions;
- immutable ledger;
- deterministic settlement evidence.

Do not restore the old White/Black-only schema.

## 5. Rules for implementation

1. Documentation before irreversible schema/API decisions.
2. A market template is incomplete without edge cases and tests.
3. Resolver logic must be deterministic and reproducible from stored game data.
4. Market selection and market pricing are separate systems.
5. AI/LLM output is never authoritative for settlement.
6. Every live trade must use server-authoritative market state.
7. Design explicitly for feed latency and late-information risk.
8. Keep visible markets few and relevant.
9. Do not expand beyond chess until the core loop proves retention.
10. Do not add real-money flows during MVP validation.

## 6. Immediate next technical decisions

Before implementing the new database and trading service:

1. Freeze the first market template set.
2. Define exact event semantics and ambiguous-move rules.
3. Simulate LMSR liquidity parameter behavior.
4. Define market open/lock timing around live move ingestion.
5. Define the mobile live-screen interaction.
6. Design the new schema only after 1–4 are stable.
