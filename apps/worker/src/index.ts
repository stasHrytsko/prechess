import { Chess } from 'chess.js';
import { oppositeSide } from '@prediction-chess/shared';

const game = new Chess();

console.log('worker ready', game.fen(), 'opposite white =', oppositeSide('white'));
