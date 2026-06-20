import { Bet, MockGame, SIDE_LABEL, formatCents, impliedProb } from '../../lib/mock';

interface Props {
  bets: Bet[];
  games: MockGame[];
  probByGame: Record<string, number>;
}

export function ActiveBets({ bets, games, probByGame }: Props) {
  return (
    <div className="card">
      <h2>Открытые позиции</h2>
      {bets.length === 0 && (
        <div className="empty">Пока нет позиций. Купи доли, чтобы видеть P/L в реальном времени.</div>
      )}
      {bets.map((bet) => {
        const game = games.find((g) => g.id === bet.gameId);
        const white = probByGame[bet.gameId] ?? bet.entryProb;
        const curProb = impliedProb(white, bet.side);
        // Mark-to-market: current value of the held shares at the live price.
        const markValue = bet.shares * curProb * 100;
        const pl = Math.round(markValue - bet.stake);
        const up = pl >= 0;
        return (
          <div className="bet" key={bet.id}>
            <div className="meta">
              <span className={`pill ${bet.side}`}>{SIDE_LABEL[bet.side]}</span>
              <div>
                <div className="bet-game">
                  {game ? `${game.white.name.split(' ')[0]} vs ${game.black.name.split(' ')[0]}` : '—'}
                </div>
                <div className="sub">
                  {bet.stake} очк. · вход {formatCents(bet.entryProb)} · сейчас {formatCents(curProb)}
                </div>
              </div>
            </div>
            <div className="pl">
              <div className={`now ${up ? 'up' : 'down'}`}>
                {up ? '+' : ''}
                {pl} очк.
              </div>
              <div className="sub">к выплате {bet.payout}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
