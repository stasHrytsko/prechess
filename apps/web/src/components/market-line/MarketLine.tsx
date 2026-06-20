import { ProbPoint, formatPct } from '../../lib/mock';

interface Props {
  history: ProbPoint[];
}

export function MarketLine({ history }: Props) {
  const white = history.length ? history[history.length - 1].white : 0.5;
  const black = 1 - white;

  const W = 600;
  const H = 110;
  const n = history.length;
  const path = history
    .map((p, i) => {
      const x = n <= 1 ? 0 : (i / (n - 1)) * W;
      const y = (1 - p.white) * H;
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
  const area = `${path} L${W},${H} L0,${H} Z`;

  return (
    <div className="card">
      <div className="line-head">
        <div className="prob white">
          <span className="who">White win</span>
          <span className="val">{formatPct(white)}</span>
        </div>
        <span className="live">
          <span className="blip" /> Live
        </span>
        <div className="prob black">
          <span className="who">Black win</span>
          <span className="val">{formatPct(black)}</span>
        </div>
      </div>

      <svg className="spark" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#34d399" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1="0" y1={H / 2} x2={W} y2={H / 2} stroke="#262b3d" strokeDasharray="4 6" />
        <path d={area} fill="url(#fill)" />
        <path d={path} fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>

      <div className="probbar">
        <div className="w" style={{ width: `${white * 100}%` }} />
        <div className="b" style={{ width: `${black * 100}%` }} />
      </div>
    </div>
  );
}
