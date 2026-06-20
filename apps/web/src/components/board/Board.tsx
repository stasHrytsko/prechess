import { fenToBoard } from '../../lib/mock';

interface Props {
  fen: string;
}

export function Board({ fen }: Props) {
  const squares = fenToBoard(fen);
  return (
    <div className="board">
      {squares.map((sq, i) => (
        <div key={i} className={`sq ${sq.light ? 'light' : 'dark'}`}>
          {sq.piece && <span className="glyph">{sq.piece}</span>}
        </div>
      ))}
    </div>
  );
}
