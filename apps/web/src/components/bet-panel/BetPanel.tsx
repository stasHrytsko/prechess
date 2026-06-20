import { useState } from 'react';
import {
  MarketSide,
  SIDE_LABEL,
  clamp,
  formatCents,
  impliedProb,
  payoutFor,
  sharesFor,
} from '../../lib/mock';

interface Props {
  white: number;
  balance: number;
  onPlace: (
    side: MarketSide,
    stake: number,
    entryProb: number,
    shares: number,
    payout: number,
  ) => void;
}

const QUICK = [50, 100, 250];

export function BetPanel({ white, balance, onPlace }: Props) {
  const [side, setSide] = useState<MarketSide>('white');
  const [stake, setStake] = useState(100);

  const prob = impliedProb(white, side);
  const shares = sharesFor(stake, prob);
  const payout = payoutFor(stake, prob);
  const profit = payout - stake;
  const profitPct = stake > 0 ? Math.round((profit / stake) * 100) : 0;
  const valid = stake > 0 && stake <= balance;

  return (
    <div className="card">
      <h2>Купить доли</h2>

      <div className="sides">
        <button
          className={`side-btn white ${side === 'white' ? 'sel' : ''}`}
          onClick={() => setSide('white')}
        >
          <div className="name">Белые</div>
          <div className="odds">{formatCents(white)}</div>
        </button>
        <button
          className={`side-btn black ${side === 'black' ? 'sel' : ''}`}
          onClick={() => setSide('black')}
        >
          <div className="name">Чёрные</div>
          <div className="odds">{formatCents(1 - white)}</div>
        </button>
      </div>

      <label className="field-lbl">Сумма (очки)</label>
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
          Макс
        </button>
      </div>

      <div className="payout">
        <span>Цена · доли</span>
        <span>
          {formatCents(prob)} · ≈ {shares.toFixed(2)}
        </span>
      </div>
      <div className="payout">
        <span>К получению при выигрыше</span>
        <b>
          {payout} очк. <span className="gain">(+{profitPct}%)</span>
        </b>
      </div>

      <button className="place" disabled={!valid} onClick={() => onPlace(side, stake, prob, shares, payout)}>
        {valid ? `Купить · ${SIDE_LABEL[side]}` : 'Недостаточно очков'}
      </button>
    </div>
  );
}
