# PreChess — Live Chess Prediction Market

**Status:** product source of truth  
**Updated:** 2026-09-26  
**Platform:** mobile application  
**Scope:** chess only, virtual points in MVP

---

## 1. Product thesis

PreChess is a live prediction market layered on top of a real chess game.

A group of spectators watches the same live game. While the game is being played, PreChess continuously opens short-lived markets about what will happen next on the board. Spectators buy and sell outcome shares using virtual points. The crowd itself moves market prices. When the relevant chess event happens — or the market horizon expires — the market resolves automatically from the move feed.

The product is not a sportsbook with fixed odds and not a chess-analysis app with a betting widget attached.

The core product is:

> **watch a live position → form a hypothesis about the near future → trade it against the crowd → watch the moves resolve it → immediately get the next market**

The long-term "who wins the game?" market may exist, but it is secondary. The main engagement loop is a stream of short and medium-horizon chess prediction markets.

---

## 2. What makes PreChess different

Traditional chess viewing is passive: watch, evaluate, wait.

Traditional betting is usually coarse: pick a winner before or during the game and wait for the final result.

PreChess turns every phase of a chess game into a sequence of small forecastable questions:

- Will White castle in the next 4 White moves?
- What happens first: check, capture, castle, or none of these?
- Will the queens be traded before move 20?
- Which side makes the next capture?
- Will there be a check in the next 6 plies?
- Will the next captured piece be a knight or bishop?
- Will a pawn reach the fifth rank before the next capture?
- Which king comes under check first?

The spectator is no longer only asking "who is better?" but "what exactly happens next?"

That creates repeated decisions and repeated resolutions inside one game.

---

## 3. Core loop

The canonical loop is:

1. A live chess move arrives.
2. The board state is updated.
3. The chess event detector derives objective facts from the move and position.
4. The market generator evaluates which market templates are currently applicable.
5. Candidate markets are scored for relevance.
6. The best few markets are opened.
7. All spectators of that game see the same live markets.
8. Users buy or sell outcome shares with virtual points.
9. Trading changes market prices.
10. The next real chess moves arrive.
11. Markets either resolve early when their event occurs or expire at a defined horizon.
12. Winning shares redeem at 100 points; losing shares redeem at 0.
13. P/L and crowd accuracy update instantly.
14. New markets replace resolved ones.

The user should be able to complete this loop many times during one chess game.

---

## 4. Three horizons of prediction

The live screen should normally expose only a small number of markets, not a catalogue.

Target structure:

### 4.1 Long market
One slow market that can remain open for much of the game.

Example:
- Who wins the game?
- White / Draw / Black

This market gives continuity but is not the main loop.

### 4.2 Medium market
A context-specific event with a horizon of several moves.

Examples:
- Will White castle before move 12?
- Will the queens be traded before move 20?
- Will either side lose a rook before move 25?

### 4.3 Short market
A very fast market that resolves in the next few plies.

Example:

**What happens first in the next 6 plies?**
- Check
- Capture
- Castle
- None

The short market is the primary engagement mechanic.

The app should usually show around 3 active markets per game. The exact number is a product-tuning variable, but the default principle is **few, relevant, fast**.

---

## 5. Market language, not thousands of handwritten questions

We do not manually author every possible market.

We define a finite, formal market language: a library of validated templates plus parameters.

A template defines:

- market family;
- human-readable question pattern;
- legal outcomes;
- start condition;
- horizon;
- eligibility rules;
- close rule;
- deterministic resolve rule;
- void/refund rules;
- optional relevance features.

Example:

```text
template: FIRST_EVENT
start_ply: 24
horizon_plies: 6
outcomes:
  - check
  - capture
  - castle
  - none
resolver: first matching event in canonical move order
```

The UI may render this as:

> What happens first in the next 6 plies?

The text is presentation. The formal template is the contract.

---

## 6. Why templates must be deterministic

Every market must be resolvable from chess data without human judgement.

Good events:

- check;
- checkmate;
- capture;
- capture by a specific side;
- captured piece type;
- castling;
- kingside vs queenside castling;
- queen trade;
- promotion;
- en passant;
- pawn reaches a specified rank;
- a specified piece is captured;
- material threshold crossed;
- game result;
- repetition/draw condition when objectively represented by the game result/feed.

Bad events for the core system:

- "attack on the king";
- "dangerous position";
- "strong initiative";
- "brilliant move";
- "sacrifice" unless formally defined;
- "player is under pressure";
- "aggressive move".

These require interpretation. They may later exist only if they are converted into precise machine rules.

Rule: **if two independent resolvers can disagree about the result, the market definition is not ready.**

---

## 7. Initial event vocabulary

The first implementation should support a small but useful event vocabulary.

### Move-level events
- quiet move
- capture
- check
- checkmate
- castle kingside
- castle queenside
- promotion
- en passant

### Piece-level events
- knight captured
- bishop captured
- rook captured
- queen captured
- pawn captured
- specific tracked piece captured

### Position/state events
- queens no longer both remain on the board
- material advantage crosses a defined threshold
- pawn reaches rank N
- king loses castling rights
- both sides have castled
- only one side retains a queen

### Game-level events
- White wins
- Black wins
- draw
- game ends by feed-provided result/reason where reliable

This vocabulary can grow, but every addition must include a deterministic resolver and edge-case tests.

---

## 8. Initial market template families

### 8.1 FIRST_EVENT
Question: what happens first within a horizon?

Example:
> What happens first in the next 6 plies?
> Check / Capture / Castle / None

Resolution:
- scan moves after market opening;
- the first matching event wins;
- if no listed event occurs before the horizon, `none` wins;
- if one move contains multiple events, a predefined precedence rule must be part of the template.

Preferred alternative: design outcome sets that avoid ambiguous simultaneous events where possible.

### 8.2 EVENT_WITHIN
Question: will event X occur within N plies?

Example:
> Will there be a check in the next 6 plies?
> Yes / No

### 8.3 PLAYER_EVENT_WITHIN
Question: will a particular side perform event X within its next N moves?

Example:
> Will White castle within the next 4 White moves?
> Yes / No

The horizon is side-relative, not generic ply count.

### 8.4 EVENT_BEFORE_MOVE
Question: will event X happen before a fixed move number?

Example:
> Will the queens be traded before move 20?
> Yes / No

### 8.5 NEXT_ACTOR
Question: which side performs event X next?

Example:
> Who makes the next capture?
> White / Black / No capture before horizon

### 8.6 NEXT_OBJECT
Question: what object/type is involved in the next event?

Example:
> Which piece type is captured next?
> Pawn / Knight / Bishop / Rook / Queen / None before horizon

Only expose outcome sets that are understandable on mobile.

### 8.7 RACE
Question: which of two or more events happens first?

Example:
> What happens first?
> White castles / first capture / first check / none before horizon

### 8.8 GAME_RESULT
Long-horizon market:
> Who wins?
> White / Draw / Black

This exists as an anchor, not as the primary engagement mechanic.

---

## 9. Market Generator

The Market Generator does not invent arbitrary prose.

Its job is to take the current chess position and the validated template library and answer:

> Which markets are applicable and interesting right now?

Pipeline:

```text
Current position
    ↓
Template eligibility
    ↓
Candidate instantiation
    ↓
Candidate quality scoring
    ↓
Deduplication / diversity
    ↓
Open top markets
```

Example:

If White has already castled, a "Will White castle?" market is ineligible.

If White can legally castle and castling is positionally plausible, the market becomes a candidate.

If queens have already been traded, all future queen-trade markets are ineligible.

---

## 10. Relevance scoring

A market should not be opened merely because it is technically possible.

Each candidate should receive a relevance score based on features such as:

### Immediacy
Can this market plausibly resolve soon?

Shorter useful resolution is generally better.

### Uncertainty
Is the outcome non-obvious?

A 99/1 question is usually bad entertainment. A market around meaningful uncertainty is better.

### Position relevance
Does the current board make this question naturally interesting?

Example: castling is relevant only while castling is available and strategically live.

### Comprehensibility
Can a normal chess spectator understand the question immediately?

### Resolvability
Can the market be resolved from the move feed with no subjective interpretation?

### Diversity
Do the currently visible markets ask meaningfully different questions?

Avoid three markets that are all indirect versions of "will there be a capture?"

### Freshness
Do not repeatedly show the same template unless the position has meaningfully changed.

A possible conceptual score:

```text
market_score =
  immediacy
+ uncertainty
+ position_relevance
+ comprehensibility
+ diversity_bonus
- repetition_penalty
- ambiguity_penalty
```

The exact formula is not fixed yet.

---

## 11. Role of Stockfish

Stockfish is useful, but it must not be treated as the market author.

Stockfish is optimized to evaluate chess positions and moves. It is not directly a calibrated model of what a human player will do next.

Use Stockfish as one signal among several:

- current evaluation;
- top candidate moves;
- tactical volatility;
- whether an event appears in top lines;
- approximate depth to likely tactical events;
- position complexity.

Do not translate "Stockfish's best line contains O-O" into "70% chance White castles".

For future market-probability estimation, a human-move model or historical game model may be more appropriate than engine evaluation alone.

For MVP, the crowd itself is the main probability mechanism.

---

## 12. How a prediction market works

A market has mutually exclusive outcomes.

Example:

> What happens first in the next 6 plies?

- Check
- Capture
- Castle
- None

Each outcome has a tradable share.

One winning share redeems for **100 points** when the market resolves.

Losing shares redeem for **0**.

The displayed market price therefore acts as an implied crowd probability.

Example:

- Check — 31
- Capture — 42
- Castle — 17
- None — 10

The sum is approximately 100.

A user who believes Check is underpriced buys Check shares.

If many users buy Check, its price rises.

This is the central social signal of the product:

> **the price is the crowd's current belief**

---

## 13. Why we need an automated market maker

Short chess markets may live only seconds or minutes.

A traditional order book creates a cold-start problem:

- a buyer needs a seller;
- thin markets have poor liquidity;
- new markets may have no counterparty;
- a two-minute market cannot wait for matching orders.

Therefore the recommended MVP market mechanism is an automated market maker.

The leading candidate is **LMSR — Logarithmic Market Scoring Rule**.

Why it fits:

- every outcome always has a price;
- a user can trade without waiting for another user;
- prices move continuously as shares are bought and sold;
- the market naturally aggregates crowd beliefs;
- liquidity can be controlled by a parameter;
- maximum market-maker loss can be bounded mathematically.

This decision must be validated with simulation before production implementation.

---

## 14. LMSR conceptual model

For outcomes `1..n`, the market maker tracks outstanding share quantities.

The cost function is:

```text
C(q) = b * ln(sum(exp(q_i / b)))
```

Where:
- `q_i` = outstanding shares of outcome i;
- `b` = liquidity parameter.

The instantaneous price of outcome i is the softmax:

```text
p_i = exp(q_i / b) / sum(exp(q_j / b))
```

Properties:
- prices sum to 1;
- buying an outcome raises its price;
- other outcomes fall;
- larger `b` means deeper liquidity and less price movement per trade;
- smaller `b` creates more responsive but more volatile prices.

In PreChess UI, `p = 0.37` can be displayed as **37** or **37%** depending on the final visual language.

The app should hide the formula from normal users. They see a simple live price.

---

## 15. Trading flow

Example market:

> Will there be a check in the next 6 plies?

Current market:
- Yes — 34
- No — 66

User has 1,000 virtual points.

User believes Yes is too cheap.

They tap **Yes**, choose 200 points, and see before confirmation:

- current price;
- estimated average execution price;
- shares received;
- possible redemption if Yes wins;
- price impact;
- remaining balance.

After confirmation:
- points are debited;
- shares are credited;
- LMSR state changes;
- Yes price may move from 34 to 38;
- all viewers receive the updated price in realtime.

The user now owns a live position.

---

## 16. Selling before resolution

A prediction market is more interesting if a position is tradable, not just a one-way bet.

Example:

1. User buys Yes at an average price of 34.
2. A move changes the position.
3. The crowd now prices Yes at 58.
4. The user can sell some or all shares before resolution.
5. Profit or loss is realized according to the LMSR cost difference.

This creates two skills:

- predicting the final event;
- predicting how crowd belief will move before the event resolves.

MVP recommendation: support both buy and sell if implementation complexity remains manageable. If a first prototype temporarily supports buy-only, this must be explicitly treated as a reduced prototype, not the final market mechanic.

---

## 17. Market lifecycle

Every market follows a strict state machine.

```text
candidate
→ scheduled/opening
→ open
→ locked
→ resolved | void
→ settled
```

### Candidate
Generated internally but not visible.

### Opening
Initial outcomes and starting AMM state are prepared.

### Open
Users may trade.

### Locked
No more trades. This prevents race conditions around a move or resolution boundary.

### Resolved
A deterministic outcome is known.

### Void
The contract cannot be resolved according to its rules.

### Settled
Share redemptions/refunds are applied to user balances and the ledger.

State transitions must be server-authoritative.

---

## 18. When markets open and close

Markets must never allow a user to trade on information that the server already knows but the client has not yet rendered.

Therefore timing must be tied to the authoritative move feed.

Recommended sequence:

1. move N received by backend;
2. event detector processes move N;
3. old markets resolve if applicable;
4. position N becomes canonical;
5. generator creates/selects new markets;
6. markets open with `start_ply = N`;
7. clients receive board + markets;
8. users trade;
9. immediately before processing move N+1 for resolution, affected market trading is locked;
10. move N+1 is processed;
11. relevant markets resolve or continue.

The exact lock window depends on feed latency and must be tested.

Client clocks must never determine market validity.

---

## 19. Deterministic resolver

The resolver is one of the most important pieces of the system.

Inputs:
- market template + parameters;
- canonical start position;
- canonical move stream;
- market horizon.

Outputs:
- unresolved;
- winning outcome;
- void/refund.

Example: FIRST_EVENT

```text
start_ply = 30
horizon_plies = 6
events = [check, capture, castle]
fallback = none
```

For plies 31..36:
- parse each move;
- derive its event flags;
- apply contract precedence rules;
- the first matching outcome wins.

If nothing matches by ply 36, `none` wins.

Resolution must be reproducible from stored PGN/moves.

---

## 20. Edge cases must be part of the contract

Every template must define behavior for:

- game ends before horizon;
- player resigns;
- timeout;
- draw agreed;
- stalemate;
- checkmate;
- feed disconnect;
- corrected move/feed rollback;
- simultaneous event flags on one move;
- market opens just before game ends;
- castling rights disappear without castling;
- tracked piece is promoted/replaced/captured;
- result source conflicts with board-derived state.

No market is production-ready until these cases are specified and tested.

---

## 21. Example: FIRST_EVENT ambiguity

A capture can also give check.

If the outcomes are:

- Check
- Capture
- Castle
- None

and the move `Bxh7+` occurs, both "capture" and "check" are true.

This must not be left to interpretation.

Possible solutions:

1. Define explicit precedence, e.g. check > capture > castle.
2. Define compound outcomes, e.g. "capture with check".
3. Use mutually exclusive derived classes.
4. Avoid this market configuration entirely.

Preferred principle: **design markets with naturally exclusive outcomes instead of relying on hidden precedence rules.**

---

## 22. Crowd and social layer

All spectators of the same game should see the same canonical market prices.

Useful social signals:

- current outcome prices;
- percentage of active traders on each side;
- number of traders;
- total virtual points traded;
- recent price movement;
- user's position vs crowd;
- optional friends/following comparison later.

Example:

> Check — 38  
> 62% of traders bought Check

But do not confuse:
- share price;
- user count;
- traded volume.

They are different signals.

The core emotional moment is:

> "The crowd thinks capture. I think check."

Then the board answers the question.

---

## 23. Mobile live-game screen

PreChess is mobile-first.

The live screen should optimize for one-handed, repeated decisions.

Recommended information hierarchy:

### Top
- players;
- ratings;
- clocks if available;
- event/tournament;
- current move;
- live status.

### Board
Large enough to understand the position without leaving the market flow.

### Persistent game probability
Compact White / Draw / Black live signal.

This is context, not the hero interaction.

### Active prediction market
The most urgent short market receives the strongest visual priority.

Example:

> **What happens first?**
> Next 6 plies
>
> Check 31
> Capture 42
> Castle 17
> None 10

Tap outcome → trade sheet.

### Other live markets
1–2 compact cards below.

### User position
For markets where the user owns shares:
- entry price;
- current price;
- unrealized P/L;
- sell;
- possible redemption.

The app should not make the user navigate through several screens just to place a prediction.

---

## 24. Market replacement rhythm

Resolved markets should be replaced quickly.

The user experience should feel like an uninterrupted stream:

```text
predict
→ watch
→ resolve
→ reaction
→ next prediction
```

A short celebratory result state may appear for roughly a moment, but it must not block the live board.

The next market should already be available or appear immediately.

---

## 25. Starting prices

A new market needs an initial state before the crowd has traded.

Possible approaches:

### Equal prior
For four outcomes: 25/25/25/25.

Pros:
- simple;
- transparent;
- no prediction model needed.

Cons:
- often unrealistic;
- creates easy arbitrage-like opportunities in obvious positions.

### Heuristic prior
Rules initialize prices based on position features.

Pros:
- better than equal priors;
- understandable.

Cons:
- manual tuning.

### Model prior
A model estimates event probabilities from historical positions / candidate lines.

Pros:
- potentially accurate;
- better initial markets.

Cons:
- much harder;
- calibration required.

MVP recommendation:
start with conservative heuristic or simple model-assisted priors, then let the market move prices. Do not delay the product waiting for perfect predictive probabilities.

Initial price generation is separate from market selection.

---

## 26. Market selection vs market pricing

These are different systems.

### Market selection asks:
"What question is interesting now?"

Inputs:
- board state;
- legal moves;
- castling rights;
- material;
- recent moves;
- engine signals;
- template eligibility;
- recent market history.

### Market pricing asks:
"What probability does each outcome currently have?"

Inputs may include:
- initial prior;
- AMM state;
- crowd trades.

Do not conflate them.

Stockfish may help select a market without directly setting its price.

---

## 27. Virtual economy for MVP

MVP uses virtual points only.

Goals:
- test whether users trade repeatedly;
- test whether short market resolutions improve watch time;
- measure whether users understand moving prices;
- measure whether users return for another live game;
- avoid mixing product validation with real-money regulatory complexity.

Users receive an initial balance.

The system maintains an immutable ledger of:
- grants;
- buys;
- sells;
- settlements;
- refunds;
- adjustments if ever required.

Balance changes are server-authoritative.

No client may directly modify balances, shares, prices, or resolutions.

---

## 28. Core entities

The conceptual data model should eventually include at least:

### Game
- id
- source
- external_game_id
- players
- ratings
- tournament/event
- time control
- status
- current FEN
- move/ply
- PGN/move stream
- result

### MarketTemplate
- id
- family
- version
- outcome schema
- eligibility rule
- resolver rule
- horizon rule
- void rule

### Market
- id
- game_id
- template_id/version
- parameters
- start_ply
- end condition
- status
- created_at
- locked_at
- resolved_at
- winning_outcome
- resolver evidence

### Outcome
- id
- market_id
- key
- label
- current AMM state/quantity

### Trade
- id
- user_id
- market_id
- outcome_id
- side: buy/sell
- points spent/received
- shares
- average execution price
- AMM state before/after
- created_at

### Position
- user_id
- market_id
- outcome_id
- net shares
- cost basis
- realized P/L
- unrealized P/L

### Ledger
- immutable points movement history

### ChessEvent
- game_id
- ply
- move
- FEN before/after
- derived event flags
- source timestamp

The actual database schema must be designed from this model; the deleted winner-only schema must not be reused blindly.

---

## 29. System pipeline

Target architecture:

```text
Live chess source
      ↓
Move ingestion
      ↓
Canonical game state
      ↓
Chess event detector
      ├──────────────→ Resolver
      ↓
Market candidate generator
      ↓
Relevance scorer
      ↓
Market scheduler
      ↓
LMSR market service
      ↕
Mobile clients
      ↓
Trades / positions
      ↓
Settlement + ledger
```

Optional engine/model inputs:

```text
Stockfish / move model / historical data
      ↓
market relevance + initial priors
```

---

## 30. What AI/LLM may and may not do

An LLM may help:

- phrase a formal market naturally;
- generate internal explanations;
- suggest new template ideas for review;
- classify UX copy.

An LLM must not be authoritative for:

- whether a chess event happened;
- who won a market;
- user balance;
- market state;
- trade execution.

Authoritative resolution comes from deterministic chess logic and canonical move data.

---

## 31. Anti-cheat / information asymmetry

Live prediction markets have a latency problem.

A user may receive the real move from another source before PreChess receives or renders it.

Therefore MVP design must assume information races exist.

Mitigations to evaluate:
- short lock before/around move processing;
- source timestamping;
- delay markets relative to broadcast;
- reject trades after authoritative feed timestamp thresholds;
- monitor abnormal consistently-late profitable trading;
- use only virtual points during validation.

This becomes critical before any real-value economy is considered.

---

## 32. What NOT to build first

Do not expand into:
- other sports or games;
- user-authored free-text markets;
- real money;
- deposits/withdrawals;
- KYC/AML flows;
- complex social feeds;
- dozens of simultaneous markets;
- subjective chess events;
- a giant AI market generator;
- an order book;
- custom user-created props.

First prove the live chess loop.

---

## 33. MVP market set

A practical first set should be intentionally small.

Suggested first families:

1. GAME_RESULT
2. EVENT_WITHIN(check)
3. EVENT_WITHIN(capture)
4. PLAYER_EVENT_WITHIN(castle)
5. EVENT_BEFORE_MOVE(queen_trade)
6. NEXT_ACTOR(capture)
7. NEXT_OBJECT(captured_piece_type)
8. FIRST_EVENT using a carefully mutually-exclusive outcome set

This is enough to test the concept without pretending the template library is finished.

---

## 34. MVP success criteria

The MVP is successful only if it validates behavior, not merely technical correctness.

Core measurements:

### Activation
- user opens a live game;
- understands a market;
- executes first trade quickly.

### Trading frequency
- trades per viewer per game;
- markets participated in per game;
- repeat trades after first resolution.

### Resolution engagement
- percentage of traders still watching when their market resolves;
- time between resolution and next trade.

### Market quality
- trade participation per offered market;
- skipped-market rate;
- distribution of prices at open and at resolve;
- rate of markets resolving too trivially/too slowly;
- void rate.

### Retention
- return for another live game;
- return across days / tournaments.

### Comprehension
Users understand:
- price = crowd probability signal;
- share = claim on one outcome;
- winning share = 100 points;
- they can profit/loss from trading;
- market has a specific horizon.

---

## 35. Product hypothesis to test

Primary hypothesis:

> Short, auto-resolving prediction markets make watching a chess game more engaging because spectators repeatedly commit to a concrete belief about what happens next.

Secondary hypothesis:

> Crowd-generated prices are themselves entertaining information and create a social "me vs the market" layer.

Third hypothesis:

> Users care more about repeated short predictions than a single game-winner bet.

The product should be instrumented to prove or disprove these separately.

---

## 36. Design principles

1. **Chess first.** Every market must come from the actual board state.
2. **Prediction market, not sportsbook.** Prices emerge from trading.
3. **Fast resolution.** The main loop resolves in a handful of moves.
4. **Few markets.** Relevance beats catalogue size.
5. **Objective contracts.** No subjective settlement.
6. **Shared crowd.** Everyone sees the same canonical market.
7. **Mobile speed.** A prediction should take seconds to place.
8. **Server authority.** Clients never own truth.
9. **Explainable rules.** Users can understand why a market resolved.
10. **Template before AI.** Formal contracts first; intelligence helps choose them.
11. **Virtual points first.** Validate engagement before monetization/regulation.
12. **Every market must earn its screen space.**

---

## 37. Canonical example session

Magnus vs Hikaru is live.

The user opens PreChess.

The board shows move 11. White still has kingside castling rights.

Three markets are live:

### Long
> Who wins?
> White 46 / Draw 24 / Black 30

### Medium
> Will White castle before move 15?
> Yes 61 / No 39

### Short
> What happens first in the next 6 plies?
> Check 29 / Capture 44 / Castle 18 / None 9

The user thinks a tactical check is coming and buys Check.

Other spectators buy Capture.

Check price moves from 29 to 35.

The user now sees:
- entry 31 average;
- current 35;
- position value;
- unrealized P/L.

Two moves later Hikaru captures a pawn.

The short market locks and resolves to Capture.

Check shares redeem at 0. Capture shares redeem at 100.

The result flashes briefly.

A new market immediately replaces it:

> Who makes the next check?
> White / Black / No check in next 8 plies

The user forms the next hypothesis without leaving the game.

That repeated rhythm is PreChess.

---

## 38. Current product boundary

As of this document, PreChess is:

- mobile-first;
- chess-only;
- live;
- prediction-market based;
- virtual-points only for MVP;
- driven by formal auto-resolving chess props;
- crowd-priced through an AMM design, with LMSR the leading mechanism;
- built around repeated short and medium predictions.

Anything in older repository code or documentation that describes the product as a winner-only web betting prototype is obsolete.

This document is the primary product definition until explicitly superseded by a newer version.
