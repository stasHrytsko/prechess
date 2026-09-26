# Acceptance Criteria

The first meaningful MVP is ready to test when:

1. A user can open a live chess game on mobile and see the current board state.
2. The same active markets and prices are visible to all viewers of that game.
3. The system can instantiate applicable markets from formal templates.
4. At least one short market resolves within a small number of plies.
5. A user can buy outcome shares with virtual points.
6. Market prices move as users trade through the AMM.
7. A user position shows shares, entry price and current value.
8. The backend locks markets against late-information trades.
9. A deterministic resolver can reproduce the result from stored moves.
10. Winning shares settle to 100 points and losing shares to 0; void markets refund according to contract.
11. Balance, trades, positions and settlements are server-authoritative and auditable.
12. A resolved short market is quickly replaced by a new relevant market.
13. The product records activation, trades per game, market participation, resolution engagement, void rate and return behavior.
14. No winner-only mock logic is required for the product loop to function.

Product behavior and market semantics are defined in `prediction-market.md`.
