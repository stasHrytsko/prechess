import { useEffect, useRef, useState } from 'react';
import { Board } from './components/board/Board';
import { MarketLine } from './components/market-line/MarketLine';
import { BetPanel } from './components/bet-panel/BetPanel';
import { ActiveBets } from './components/bet-panel/ActiveBets';
import { Leaderboard } from './components/leaderboard/Leaderboard';
import {
  Bet,
  INITIAL_BALANCE,
  MOCK_GAME,
  MOCK_LEADERBOARD,
  MarketSide,
  ProbPoint,
  nextProb,
} from './lib/mock';

export default function App() {
  const [history, setHistory] = useState<ProbPoint[]>(() => {
    const now = Date.now();
    // Seed with a short flat-ish history so the line isn't empty on load.
    let w = 0.58;
    return Array.from({ length: 24 }, (_, i) => {
      w = nextProb(w);
      return { t: now - (24 - i) * 1500, white: w };
    });
  });
  const [balance, setBalance] = useState(INITIAL_BALANCE);
  const [bets, setBets] = useState<Bet[]>([]);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number>();

  const white = history[history.length - 1].white;

  // Live probability tick — simulates the worker pushing realtime updates.
  useEffect(() => {
    const id = window.setInterval(() => {
      setHistory((prev) => {
        const last = prev[prev.length - 1];
        const next: ProbPoint = { t: Date.now(), white: nextProb(last.white) };
        return [...prev.slice(-59), next];
      });
    }, 1500);
    return () => window.clearInterval(id);
  }, []);

  function placeBet(side: MarketSide, stake: number, entryProb: number, payout: number) {
    setBalance((b) => b - stake);
    setBets((prev) => [
      { id: crypto.randomUUID(), side, stake, entryProb, payout, createdAt: Date.now() },
      ...prev,
    ]);
    setToast(`Bet placed: ${stake} pts on ${side}`);
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
            <div className="tag">Virtual points · live win-probability markets</div>
          </div>
        </div>
        <div className="balance">
          <span className="lbl">Balance</span>
          <span className="pts">{balance.toLocaleString()}</span>
          <span className="lbl">pts</span>
        </div>
      </header>

      <div className="grid">
        <div className="stack">
          <div className="card">
            <div className="match">
              <div className="player">
                <span className="dot white" /> {MOCK_GAME.whitePlayer}
              </div>
              <span className="vs">move {MOCK_GAME.moveNumber}</span>
              <div className="player">
                {MOCK_GAME.blackPlayer} <span className="dot black" />
              </div>
            </div>
            <Board fen={MOCK_GAME.fen} />
            <div className="match" style={{ marginTop: 12, marginBottom: 0 }}>
              <span className="event">{MOCK_GAME.event}</span>
            </div>
          </div>
          <MarketLine history={history} />
        </div>

        <div className="stack">
          <BetPanel white={white} balance={balance} onPlace={placeBet} />
          <ActiveBets bets={bets} white={white} />
          <Leaderboard rows={leaderboard} />
        </div>
      </div>

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
