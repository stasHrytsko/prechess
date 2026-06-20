import { Bet, formatPct, impliedProb, payoutFor } from '../../lib/mock';

interface Props {
  bets: Bet[];
  white: number;
}

export function ActiveBets({ bets, white }: Props) {
  return (
    <div className="card">
      <h2>Your open bets</h2>
      {bets.length === 0 && <div className="empty">No bets yet. Place one to see the live P/L.</div>}
      {bets.map((bet) => {
        const curProb = impliedProb(white, bet.side);
        // Mark-to-market: what we'd be able to cash out for right now.
        const markValue = payoutFor(bet.stake, curProb) * curProb;
        const pl = Math.round(markValue - bet.stake);
        const up = pl >= 0;
        return (
          <div className="bet" key={bet.id}>
            <div className="meta">
              <span className={`pill ${bet.side}`}>{bet.side}</span>
              <div>
                <div>{bet.stake} pts</div>
                <div className="sub">
                  entry {formatPct(bet.entryProb)} · now {formatPct(curProb)}
                </div>
              </div>
            </div>
            <div className="pl">
              <div className={`now ${up ? 'up' : 'down'}`}>
                {up ? '+' : ''}
                {pl} pts
              </div>
              <div className="sub">to win {bet.payout}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
