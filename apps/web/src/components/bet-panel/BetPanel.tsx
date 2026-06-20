import { useState } from 'react';
import {
  MarketSide,
  clamp,
  formatPct,
  impliedProb,
  payoutFor,
} from '../../lib/mock';

interface Props {
  white: number;
  balance: number;
  onPlace: (side: MarketSide, stake: number, entryProb: number, payout: number) => void;
}

const QUICK = [50, 100, 250];

export function BetPanel({ white, balance, onPlace }: Props) {
  const [side, setSide] = useState<MarketSide>('white');
  const [stake, setStake] = useState(100);

  const prob = impliedProb(white, side);
  const odds = 1 / clamp(prob, 0.02, 0.98);
  const payout = payoutFor(stake, prob);
  const valid = stake > 0 && stake <= balance;

  return (
    <div className="card">
      <h2>Place a bet</h2>

      <div className="sides">
        <button
          className={`side-btn white ${side === 'white' ? 'sel' : ''}`}
          onClick={() => setSide('white')}
        >
          <div className="name">White wins</div>
          <div className="odds">{(1 / clamp(white, 0.02, 0.98)).toFixed(2)}×</div>
        </button>
        <button
          className={`side-btn black ${side === 'black' ? 'sel' : ''}`}
          onClick={() => setSide('black')}
        >
          <div className="name">Black wins</div>
          <div className="odds">{(1 / clamp(1 - white, 0.02, 0.98)).toFixed(2)}×</div>
        </button>
      </div>

      <div className="stake-row">
        <input
          className="stake-input"
          type="number"
          min={1}
          max={balance}
          value={stake}
          onChange={(e) => setStake(clamp(Math.round(Number(e.target.value) || 0), 0, balance))}
        />
      </div>
      <div className="chips">
        {QUICK.map((q) => (
          <button key={q} className="chip" onClick={() => setStake(clamp(q, 0, balance))}>
            +{q}
          </button>
        ))}
        <button className="chip" onClick={() => setStake(balance)}>
          Max
        </button>
      </div>

      <div className="payout">
        <span>
          Entry odds {odds.toFixed(2)}× · win chance {formatPct(prob)}
        </span>
      </div>
      <div className="payout">
        <span>Potential payout</span>
        <b>{payout} pts</b>
      </div>

      <button className="place" disabled={!valid} onClick={() => onPlace(side, stake, prob, payout)}>
        {valid ? `Bet ${stake} on ${side}` : 'Not enough points'}
      </button>
    </div>
  );
}
