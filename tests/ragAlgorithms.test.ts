import { reciprocalRankFusion, /* keywordSearch */ } from '../services/ragService';

console.log('RRF: fusion order');

const a = [
  { chunk: { id: 'A' } as any, score: 0.9 },
  { chunk: { id: 'B' } as any, score: 0.8 },
];
const b = [
  { chunk: { id: 'B' } as any, score: 0.95 },
  { chunk: { id: 'C' } as any, score: 0.7 },
];

const fused = reciprocalRankFusion([a, b]);
if (fused[0].chunk.id !== 'B') {
  throw new Error('RRF should favor item present at top in both lists (B)');
}

console.log('RRF: OK');

