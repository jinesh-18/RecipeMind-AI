/**
 * Document Service
 * Manages recipe document storage, metadata, and lifecycle.
 * Uses localStorage for persistence in the MVP.
 * Ready for replacement with a vector database / IBM RAG service.
 */

import { v4 as uuidv4 } from 'uuid';
import type { RecipeDocument, TextChunk } from '../types';
import { extractTextFromFile, chunkText } from './textExtractionService';
import { DEMO_DOCUMENT } from '../data/demoData';

const STORAGE_KEY = 'recipemind_documents';

function loadDocuments(): RecipeDocument[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      // Seed with demo document on first launch
      const initial = [DEMO_DOCUMENT];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(stored);
  } catch {
    return [DEMO_DOCUMENT];
  }
}

function saveDocuments(docs: RecipeDocument[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export function getDocuments(): RecipeDocument[] {
  return loadDocuments();
}

export async function uploadDocument(file: File): Promise<RecipeDocument> {
  const extension = file.name.split('.').pop()?.toLowerCase() as 'pdf' | 'txt' | 'docx';

  if (!['pdf', 'txt', 'docx'].includes(extension)) {
    throw new Error('Only PDF, TXT, and DOCX files are supported.');
  }

  if (file.size > 10 * 1024 * 1024) {
    throw new Error('File size must be under 10 MB.');
  }

  const docs = loadDocuments();
  if (docs.some(d => d.name === file.name)) {
    throw new Error(`A document named "${file.name}" is already uploaded.`);
  }

  const docId = uuidv4();
  const newDoc: RecipeDocument = {
    id: docId,
    name: file.name,
    type: extension,
    size: file.size,
    uploadedAt: new Date().toISOString(),
    status: 'processing',
    chunks: [],
    recipeCount: 0,
  };

  // Persist immediately so UI shows the processing state
  docs.push(newDoc);
  saveDocuments(docs);

  try {
    const { text, success, error } = await extractTextFromFile(file);

    if (!success) {
      newDoc.status = 'error';
      newDoc.errorMessage = error;
    } else {
      const rawChunks = chunkText(text);
      newDoc.chunks = rawChunks.map((content, index) => ({
        id: uuidv4(),
        documentId: docId,
        documentName: file.name,
        content,
        index,
      }));
      newDoc.recipeCount = estimateRecipeCount(text);
      newDoc.status = 'ready';
    }
  } catch (err) {
    newDoc.status = 'error';
    newDoc.errorMessage = (err as Error).message;
  }

  // Update the stored document
  const updatedDocs = loadDocuments().map(d => (d.id === docId ? newDoc : d));
  saveDocuments(updatedDocs);

  return newDoc;
}

export function deleteDocument(id: string): void {
  const docs = loadDocuments().filter(d => d.id !== id);
  saveDocuments(docs);
}

export function getDocumentById(id: string): RecipeDocument | undefined {
  return loadDocuments().find(d => d.id === id);
}

export function getAllChunks(): TextChunk[] {
  return loadDocuments().flatMap(d => d.chunks);
}

function estimateRecipeCount(text: string): number {
  // Heuristic: count likely recipe starts by looking for common patterns
  const matches = text.match(/(?:recipe|ingredients:|serves:|servings:)/gi);
  return Math.max(1, Math.floor((matches?.length ?? 1) / 2));
}
