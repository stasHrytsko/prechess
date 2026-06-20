import { oppositeSide } from '@prediction-chess/shared';

export default function App() {
  return (
    <main style={{ padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>Prediction Chess</h1>
      <p>Monorepo scaffold is ready.</p>
      <p>Shared helper example: opposite of white is {oppositeSide('white')}.</p>
    </main>
  );
}
