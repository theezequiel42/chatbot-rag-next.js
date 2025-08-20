// services/ragService.ts

import { KNOWLEDGE_BASE } from '../knowledgeBase';
import type { KnowledgeChunk } from '../types';
import { loadEmbeddingModel, embed } from './embeddingService';
import { cosineSimilarity } from './vectorUtils';

interface VectorizedChunk {
  chunk: KnowledgeChunk;
  embedding: number[];
}

interface ScoredChunk {
  chunk: KnowledgeChunk;
  score: number;
}

let vectorizedKnowledgeBase: VectorizedChunk[] = [];
let isInitialized = false;

/**
 * Initializes the RAG service by loading the embedding model,
 * and creating vector embeddings for each chunk in the knowledge base.
 */
export const initializeRag = async (): Promise<void> => {
  if (isInitialized) {
    return;
  }
  
  await loadEmbeddingModel();

  const textsToEmbed = KNOWLEDGE_BASE.map(
    chunk => `${chunk.title}\n${chunk.content}`
  );
  
  console.log(`Generating embeddings for ${KNOWLEDGE_BASE.length} chunks...`);
  const embeddings = await embed(textsToEmbed);

  vectorizedKnowledgeBase = KNOWLEDGE_BASE.map((chunk, i) => ({
    chunk: chunk,
    embedding: embeddings[i],
  }));

  isInitialized = true;
  console.log('RAG service initialized successfully.');
};

// --- Keyword Search Implementation ---

const normalizeText = (text: string): string[] => {
  return text
    .toLowerCase()
    .normalize("NFD") // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, "") // Remove accent marks
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/) // Split by whitespace
    .filter(Boolean); // Remove empty strings
};

const keywordSearch = (query: string, knowledgeBase: KnowledgeChunk[]): ScoredChunk[] => {
  const queryTokens = normalizeText(query);
  const scores: { [id: string]: number } = {};

  for (const chunk of knowledgeBase) {
    scores[chunk.id] = 0;
    const titleTokens = normalizeText(chunk.title);
    const contentTokens = normalizeText(chunk.content);
    const tagTokens = normalizeText(chunk.tags.join(' '));

    for (const token of queryTokens) {
      if (titleTokens.includes(token)) scores[chunk.id] += 3; // Higher weight for title
      if (contentTokens.includes(token)) scores[chunk.id] += 1;
      if (tagTokens.includes(token)) scores[chunk.id] += 2; // Medium weight for tags
    }
  }

  return Object.entries(scores)
    .filter(([, score]) => score > 0)
    .map(([id, score]) => ({
      chunk: knowledgeBase.find(c => c.id === id)!,
      score,
    }))
    .sort((a, b) => b.score - a.score);
};

// --- Reciprocal Rank Fusion (RRF) Implementation ---

const reciprocalRankFusion = (resultsLists: ScoredChunk[][], k: number = 60): ScoredChunk[] => {
  const fusedScores: { [id: string]: number } = {};

  for (const results of resultsLists) {
    for (let i = 0; i < results.length; i++) {
      const rank = i + 1;
      const chunkId = results[i].chunk.id;
      const rrfScore = 1 / (k + rank);
      
      fusedScores[chunkId] = (fusedScores[chunkId] || 0) + rrfScore;
    }
  }

  return Object.entries(fusedScores)
    .map(([id, score]) => ({
      chunk: KNOWLEDGE_BASE.find(c => c.id === id)!,
      score,
    }))
    .sort((a, b) => b.score - a.score);
};

/**
 * Retrieves the most relevant context using a Hybrid Search approach.
 * @param query The user's message.
 * @param topK The number of top results to return.
 * @returns A string containing the concatenated relevant chunks.
 */
export const retrieveContext = async (query: string, topK: number = 5): Promise<string> => {
  if (!isInitialized) {
    throw new Error('RAG service not initialized. Call initializeRag() first.');
  }

  // 1. Perform Semantic Search
  const [queryEmbedding] = await embed([query]);
  const semanticResults: ScoredChunk[] = vectorizedKnowledgeBase.map(item => ({
    chunk: item.chunk,
    score: cosineSimilarity(queryEmbedding, item.embedding),
  })).sort((a, b) => b.score - a.score);

  // 2. Perform Keyword Search
  const keywordResults: ScoredChunk[] = keywordSearch(query, KNOWLEDGE_BASE);

  // 3. Fuse results using RRF
  const fusedResults = reciprocalRankFusion([semanticResults, keywordResults]);
  
  // 4. Get the top K most relevant chunks
  // We apply a baseline semantic relevance threshold to the final fused results
  // to prevent purely keyword-based matches that are semantically unrelated.
  const relevanceThreshold = 0.25;
  const relevantChunks = fusedResults
    .filter(fusedResult => {
        const originalSemanticScore = semanticResults.find(sr => sr.chunk.id === fusedResult.chunk.id)?.score ?? 0;
        return originalSemanticScore > relevanceThreshold || keywordResults.some(kr => kr.chunk.id === fusedResult.chunk.id);
    })
    .slice(0, topK);

  if (relevantChunks.length === 0) {
    return "Nenhum contexto específico encontrado.";
  }

  console.log('Hybrid Search retrieved chunks:', relevantChunks.map(c => ({
      title: c.chunk.title, 
      finalScore: c.score,
      semanticScore: semanticResults.find(sr => sr.chunk.id === c.chunk.id)?.score,
      keywordScore: keywordResults.find(kr => kr.chunk.id === c.chunk.id)?.score,
  })));

  // 5. Format and return the content of the most relevant chunks
  return relevantChunks
    .map(c => `TÍTULO: ${c.chunk.title}\nCONTEÚDO:\n${c.chunk.content}`)
    .join('\n\n---\n\n');
};