export type MarketSide = 'white' | 'black';

export function oppositeSide(side: MarketSide): MarketSide {
  return side === 'white' ? 'black' : 'white';
}
