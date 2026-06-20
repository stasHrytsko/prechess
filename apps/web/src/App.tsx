import { useEffect, useMemo, useRef, useState } from 'react';
import { Board } from './components/board/Board';
import { MarketLine } from './components/market-line/MarketLine';
import { BetPanel } from './components/bet-panel/BetPanel';
import { ActiveBets } from './components/bet-panel/ActiveBets';
import { Leaderboard } from './components/leaderboard/Leaderboard';
import { HowItWorks } from './components/how-it-works/HowItWorks';
import { GamesList } from './components/games-list/GamesList';
import {
  Bet,
  INITIAL_BALANCE,
  MARKET_QUESTION,
  MOCK_GAMES,
  MOCK_LEADERBOARD,
  MarketSide,
  ProbPoint,
  formatCents,
  formatPct,
  nextProb,
  seedHistory,
} from './lib/mock';

type Histories = Record<string, ProbPoint[]>;

export default function App() {
  const [histories, setHistories] = useState<Histories>(() => {
    const init: Histories = {};
    for (const g of MOCK_GAMES) init[g.id] = seedHistory(g.startWhite);
    return init;
  });
  const [selectedId, setSelectedId] = useState(MOCK_GAMES[0].id);
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [bets, setBets] = useState<Bet[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  // Live probability tick for every game — simulates realtime updates.
  useEffect(() => {
    const id = window.setInterval(() => {
      setHistories((prev) => {
        const next: Histories = {};
        for (const g of MOCK_GAMES) {
          const hist = prev[g.id];
          const last = hist[hist.length - 1];
          next[g.id] = [...hist.slice(-59), { t: Date.now(), white: nextProb(last.white) }];
        }
        return next;
      });
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  const probByGame = useMemo(() => {
    const map: Record<string, number> = {};
    for (const g of MOCK_GAMES) {
      const hist = histories[g.id];
      map[g.id] = hist[hist.length - 1].white;
    }
    return map;
  }, [histories]);

  const game = MOCK_GAMES.find((g) => g.id === selectedId) ?? MOCK_GAMES[0];
  const history = histories[selectedId];
  const white = history[history.length - 1].white;

  function placeBet(
    side: MarketSide,
    stake: number,
    entryProb: number,
    shares: number,
    payout: number,
  ) {
    setBalance((b) => b - stake);
    setBets((prev) => [
      {
        id: crypto.randomUUID(),
        gameId: selectedId,
        side,
        stake,
        entryProb,
        shares,
        payout,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setToast(`Позиция открыта: ${stake} очк. на «${side === 'white' ? 'Белые' : 'Чёрные'}»`);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2200);
  }

  const leaderboard = MOCK_LEADERBOARD.map((r) => (r.isYou ? { ...r, points: balance } : r));

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">♟️</span>
          <div>
            <h1>Prediction Chess</h1>
            <div className="tag">Виртуальные очки · рынки на исход партии в реальном времени</div>
          </div>
        </div>
        <div className="balance">
          <span className="lbl">Баланс</span>
          <span className="pts">{balance.toLocaleString('ru-RU')}</span>
          <span className="lbl">очк.</span>
        </div>
      </header>

      <GamesList
        games={MOCK_GAMES}
        probByGame={probByGame}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <div className="grid">
        <div className="stack">
          <div className="card">
            <div className="market-q">
              <div>
                <div className="q-title">{MARKET_QUESTION}</div>
                <div className="q-sub">
                  {game.white.name} ({game.white.rating}) vs {game.black.name} ({game.black.rating}) ·
                  ход {game.moveNumber}
                </div>
              </div>
              <span className="event">
                {game.event} · {game.timeClass}
              </span>
            </div>

            <div className="outcomes">
              <div className="outcome white">
                <span className="o-name">Белые</span>
                <span className="o-pct">{formatPct(white)}</span>
                <span className="o-price">{formatCents(white)}</span>
              </div>
              <div className="outcome black">
                <span className="o-name">Чёрные</span>
                <span className="o-pct">{formatPct(1 - white)}</span>
                <span className="o-price">{formatCents(1 - white)}</span>
              </div>
            </div>

            <Board fen={game.fen} />
          </div>
          <MarketLine history={history} />
        </div>

        <div className="stack">
          <BetPanel white={white} balance={balance} onPlace={placeBet} />
          <ActiveBets bets={bets} games={MOCK_GAMES} probByGame={probByGame} />
          <Leaderboard rows={leaderboard} />
        </div>
      </div>

      <HowItWorks />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
