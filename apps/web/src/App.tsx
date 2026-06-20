import { useEffect, useRef, useState } from 'react';
import { Board } from './components/board/Board';
import { MarketLine } from './components/market-line/MarketLine';
import { BetPanel } from './components/bet-panel/BetPanel';
import { ActiveBets } from './components/bet-panel/ActiveBets';
import { Leaderboard } from './components/leaderboard/Leaderboard';
import { HowItWorks } from './components/how-it-works/HowItWorks';
import {
  Bet,
  INITIAL_BALANCE,
  MOCK_GAME,
  MOCK_LEADERBOARD,
  MarketSide,
  ProbPoint,
  formatCents,
  formatPct,
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

  function placeBet(
    side: MarketSide,
    stake: number,
    entryProb: number,
    shares: number,
    payout: number,
  ) {
    setBalance((b) => b - stake);
    setBets((prev) => [
      { id: crypto.randomUUID(), side, stake, entryProb, shares, payout, createdAt: Date.now() },
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

      <div className="grid">
        <div className="stack">
          <div className="card">
            <div className="market-q">
              <div>
                <div className="q-title">{MOCK_GAME.question}</div>
                <div className="q-sub">
                  {MOCK_GAME.whitePlayer} vs {MOCK_GAME.blackPlayer} · ход {MOCK_GAME.moveNumber}
                </div>
              </div>
              <span className="event">{MOCK_GAME.event}</span>
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

            <Board fen={MOCK_GAME.fen} />
          </div>
          <MarketLine history={history} />
        </div>

        <div className="stack">
          <BetPanel white={white} balance={balance} onPlace={placeBet} />
          <ActiveBets bets={bets} white={white} />
          <Leaderboard rows={leaderboard} />
        </div>
      </div>

      <HowItWorks />

      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}
