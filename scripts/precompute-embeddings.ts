// scripts/precompute-embeddings.ts
// Precompute embeddings for the knowledge base using Node + tfjs-node
// Writes to public/embeddings.json

import fs from 'fs';
import path from 'path';

// Use ts-node/esm loader to import TS modules (KNOWLEDGE_BASE)
import { KNOWLEDGE_BASE } from '../knowledgeBase';

async function main() {
  const outDir = path.resolve('public');
  const outFile = path.join(outDir, 'embeddings.json');

  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  // Load tfjs-node and USE lazily
  const tf = await import('@tensorflow/tfjs-node');
  const use = await import('@tensorflow-models/universal-sentence-encoder');

  // Suppress TFJS warnings in CI/build logs
  (tf as any).env().set('PROD', true);

  console.log(`[precompute] Loading Universal Sentence Encoder...`);
  const model = await (use as any).load();

  const texts = KNOWLEDGE_BASE.map(k => `${k.title}\n${k.content}`);
  console.log(`[precompute] Generating embeddings for ${texts.length} chunks...`);
  const embeddingsTensor = await (model as any).embed(texts);
  const embeddings = await embeddingsTensor.array();
  embeddingsTensor.dispose();

  const dims = Array.isArray(embeddings[0]) ? (embeddings[0] as number[]).length : 0;

  const payload = {
    model: 'use-v1',
    dims,
    entries: KNOWLEDGE_BASE.map((k, i) => ({ id: k.id, embedding: embeddings[i] as number[] })),
  };

  fs.writeFileSync(outFile, JSON.stringify(payload));
  console.log(`[precompute] Wrote ${payload.entries.length} embeddings (${dims} dims) to ${outFile}`);
}

main().catch((err) => {
  console.error('[precompute] Failed:', err);
  process.exit(1);
});

