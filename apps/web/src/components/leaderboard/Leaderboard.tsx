import { LeaderRow } from '../../lib/mock';

interface Props {
  rows: LeaderRow[];
}

export function Leaderboard({ rows }: Props) {
  const sorted = [...rows].sort((a, b) => b.points - a.points);
  return (
    <div className="card">
      <h2>Leaderboard</h2>
      <div className="lb">
        {sorted.map((row, i) => (
          <div key={row.name} className={`lb-row ${row.isYou ? 'you' : ''}`}>
            <div className="left">
              <span className="rank">{i + 1}</span>
              <span>{row.isYou ? 'You' : row.name}</span>
            </div>
            <span className="pts">{row.points.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
