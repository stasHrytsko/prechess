import { MockGame, formatPct, formatVolume } from '../../lib/mock';

interface Props {
  games: MockGame[];
  probByGame: Record<string, number>;
  selectedId: string;
  onSelect: (id: string) => void;
}

export function GamesList({ games, probByGame, selectedId, onSelect }: Props) {
  return (
    <div className="games-section">
      <div className="games-head">
        <h2>Прямые эфиры</h2>
        <span className="games-count">{games.length} партий · обновляется в реальном времени</span>
      </div>
      <div className="games-row">
        {games.map((g) => {
          const white = probByGame[g.id] ?? g.startWhite;
          const black = 1 - white;
          const active = g.id === selectedId;
          return (
            <button
              key={g.id}
              className={`game-card ${active ? 'active' : ''}`}
              onClick={() => onSelect(g.id)}
            >
              <div className="gc-top">
                <span className="gc-live">
                  <span className="blip" /> Лайв
                </span>
                <span className="gc-tag">{g.timeClass}</span>
              </div>

              <div className="gc-player">
                <span className="dot white" />
                <span className="gc-name">{g.white.name}</span>
                <span className="gc-rating">{g.white.rating}</span>
              </div>
              <div className="gc-player">
                <span className="dot black" />
                <span className="gc-name">{g.black.name}</span>
                <span className="gc-rating">{g.black.rating}</span>
              </div>

              <div className="gc-bar">
                <div className="w" style={{ width: `${white * 100}%` }} />
                <div className="b" style={{ width: `${black * 100}%` }} />
              </div>
              <div className="gc-foot">
                <span className="gc-w">Б {formatPct(white)}</span>
                <span className="gc-vol">{formatVolume(g.volume)} очк.</span>
                <span className="gc-b">Ч {formatPct(black)}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
