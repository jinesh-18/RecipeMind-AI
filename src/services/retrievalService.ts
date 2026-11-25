/**
 * Retrieval Service
 * Keyword and scoring-based retrieval from text chunks.
 * Ready for replacement with vector embeddings and semantic search (IBM Watson Discovery / pgvector).
 */

import type { TextChunk, SourceReference } from '../types';
import { getAllChunks } from './documentService';

export interface RetrievalResult {
  chunks: TextChunk[];
  sources: SourceReference[];
}

/**
 * Retrieve the most relevant chunks for a given query using TF-IDF-inspired keyword scoring.
 */
export function retrieve(query: string, topK = 4): RetrievalResult {
  const chunks = getAllChunks();
  if (chunks.length === 0) return { chunks: [], sources: [] };

  const queryTokens = tokenize(query);
  const scored = chunks.map(chunk => ({
    chunk,
    score: scoreChunk(chunk.content, queryTokens),
  }));

  scored.sort((a, b) => b.score - a.score);
  const top = scored.filter(s => s.score > 0).slice(0, topK);

  const sources: SourceReference[] = top.map(({ chunk, score }) => ({
    documentId: chunk.documentId,
    documentName: chunk.documentName,
    relevance: Math.min(1, score / 10),
    excerpt: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? '…' : ''),
  }));

  // Deduplicate sources by documentId
  const seenDocs = new Set<string>();
  const uniqueSources = sources.filter(s => {
    if (seenDocs.has(s.documentId)) return false;
    seenDocs.add(s.documentId);
    return true;
  });

  return { chunks: top.map(t => t.chunk), sources: uniqueSources };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 2);
}

function scoreChunk(content: string, queryTokens: string[]): number {
  const contentLower = content.toLowerCase();
  let score = 0;

  for (const token of queryTokens) {
    // Exact token matches
    const regex = new RegExp(`\\b${token}\\b`, 'g');
    const matches = contentLower.match(regex);
    if (matches) score += matches.length * 2;

    // Partial matches (substring)
    if (contentLower.includes(token)) score += 1;
  }

  return score;
}

/**
 * Build a context string from retrieved chunks for the generation layer.
 */
export function buildContext(chunks: TextChunk[]): string {
  if (chunks.length === 0) return '';
  return chunks.map((c, i) => `[Context ${i + 1} from "${c.documentName}"]\n${c.content}`).join('\n\n---\n\n');
}
