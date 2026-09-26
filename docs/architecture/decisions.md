# Architecture Decisions

This file contains current architectural decisions only. The previous winner-only web MVP decision has been superseded by the PreChess live prediction-market concept.

---

## ADR-001 — Mobile-first, chess-only product

**Status:** accepted  
**Date:** 2026-09-26

PreChess is a mobile-first application focused only on live chess.

The old Vite winner-only web prototype is not the product architecture and has been removed.

---

## ADR-002 — Formal market templates + deterministic resolvers

**Status:** accepted  
**Date:** 2026-09-26

Markets are instantiated from a versioned library of formal templates. Free-text user-authored markets are not part of the MVP.

Every template must define:
- eligibility;
- outcomes;
- horizon;
- locking rule;
- deterministic resolver;
- void/refund behavior;
- edge cases.

LLMs may phrase markets but may not determine settlement.

---

## ADR-003 — Market Generator selects; it does not invent arbitrary contracts

**Status:** accepted  
**Date:** 2026-09-26

The generator evaluates the current board and chooses relevant instances from validated templates.

Stockfish may provide relevance features but is not an authoritative human-move probability model.

---

## ADR-004 — AMM-first market mechanism

**Status:** proposed / leading choice  
**Date:** 2026-09-26

Short-lived markets need guaranteed liquidity, so an automated market maker is preferred over an order book.

LMSR is the leading mechanism because it provides continuous prices, bounded market-maker loss and controllable liquidity. It must be simulated before the database/trading contract is frozen.

---

## ADR-005 — Server-authoritative timing, trading and settlement

**Status:** accepted  
**Date:** 2026-09-26

The backend owns:
- canonical move order;
- market open/lock/resolve state;
- AMM state;
- trades;
- positions;
- balances;
- settlement.

Client clocks and client-reported chess events are never authoritative.

---

## ADR-006 — Old database schema intentionally removed

**Status:** accepted  
**Date:** 2026-09-26

The previous schema modeled only White/Black winner bets and a one-way `place_bet` flow. Reusing it would lock the new product into the wrong domain model.

A new schema will be designed around games, chess events, template versions, multi-outcome markets, AMM state, trades, positions and an immutable ledger after market mechanics are validated.
