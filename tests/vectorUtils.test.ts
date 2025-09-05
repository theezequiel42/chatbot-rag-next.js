import { cosineSimilarity, dotProduct, magnitude } from '../services/vectorUtils';

const approx = (a: number, b: number, eps = 1e-6) => Math.abs(a - b) < eps;

console.log('vectorUtils: basic checks');

// Same vector => cosine = 1
const v1 = [1, 2, 3];
if (!approx(cosineSimilarity(v1, v1), 1)) {
  throw new Error('cosineSimilarity same vector should be 1');
}

// Orthogonal vectors => cosine ~ 0
const a = [1, 0, 0];
const b = [0, 1, 0];
if (!approx(cosineSimilarity(a, b), 0)) {
  throw new Error('cosineSimilarity orthogonal should be ~0');
}

// Dot product and magnitude consistency
const dp = dotProduct(v1, v1);
const mag = magnitude(v1);
if (!approx(dp, mag * mag)) {
  throw new Error('dot/magnitude relation failed');
}

console.log('vectorUtils: OK');

