/**
 * Recipe Generation Service
 * Generates structured recipes using retrieved context.
 * Currently uses a local template-based engine.
 * Interface designed for IBM Granite model replacement.
 */

import { v4 as uuidv4 } from 'uuid';
import type { Recipe, GeneratorOptions, Ingredient, Instruction } from '../types';
import { retrieve, buildContext } from './retrievalService';
import { DEMO_RECIPES } from '../data/demoData';

export interface GenerationResult {
  recipe: Recipe;
  fromDocuments: boolean;
  sourceContext?: string;
}

/**
 * Generate a recipe based on user options.
 * First attempts to find matching content in uploaded documents.
 * Falls back to built-in demo recipes if no relevant content found.
 */
export async function generateRecipe(options: GeneratorOptions): Promise<GenerationResult> {
  const query = buildGenerationQuery(options);
  const { chunks, sources } = retrieve(query, 4);
  const context = buildContext(chunks);

  if (context.length > 100) {
    return {
      recipe: generateFromContext(context, options, sources[0]),
      fromDocuments: true,
      sourceContext: context,
    };
  }

  // Fallback to matching demo recipes
  const matched = findBestDemoMatch(options);
  return {
    recipe: { ...matched, id: uuidv4(), createdAt: new Date().toISOString() },
    fromDocuments: false,
  };
}

function buildGenerationQuery(opts: GeneratorOptions): string {
  const parts: string[] = [];
  if (opts.ingredients.length) parts.push(opts.ingredients.join(' '));
  if (opts.cuisine !== 'any') parts.push(opts.cuisine);
  opts.dietary.forEach(d => parts.push(d));
  if (opts.difficulty !== 'any') parts.push(opts.difficulty);
  parts.push('recipe ingredients instructions');
  return parts.join(' ');
}

function findBestDemoMatch(opts: GeneratorOptions): Recipe {
  let candidates = [...DEMO_RECIPES];

  // Filter by cuisine
  if (opts.cuisine !== 'any') {
    const byCuisine = candidates.filter(r => r.cuisine === opts.cuisine);
    if (byCuisine.length) candidates = byCuisine;
  }

  // Filter by dietary
  if (opts.dietary.length) {
    const byDietary = candidates.filter(r => opts.dietary.every(d => r.dietary.includes(d)));
    if (byDietary.length) candidates = byDietary;
  }

  // Filter by time
  const byTime = candidates.filter(r => r.prepTime + r.cookTime <= opts.maxCookTime);
  if (byTime.length) candidates = byTime;

  // Filter by difficulty
  if (opts.difficulty !== 'any') {
    const byDiff = candidates.filter(r => r.difficulty === opts.difficulty);
    if (byDiff.length) candidates = byDiff;
  }

  const base = candidates[Math.floor(Math.random() * candidates.length)];

  // Adjust servings
  const servingRatio = opts.servings / base.servings;
  return {
    ...base,
    servings: opts.servings,
    ingredients: base.ingredients.map(ing => scaleIngredient(ing, servingRatio)),
    isDemo: true,
  };
}

function scaleIngredient(ing: Ingredient, ratio: number): Ingredient {
  const amount = parseFloat(ing.amount);
  if (isNaN(amount)) return ing;
  const scaled = (amount * ratio).toFixed(ratio < 1 ? 1 : 0);
  return { ...ing, amount: scaled };
}

const CUISINE_IMAGES: Record<string, string> = {
  Italian: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
  Indian: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&q=80',
  Mexican: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&q=80',
  Japanese: 'https://images.unsplash.com/photo-1569050467447-ce54b3bbc37d?w=600&q=80',
  Greek: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&q=80',
  American: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&q=80',
  Thai: 'https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=600&q=80',
  French: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&q=80',
};

function generateFromContext(
  context: string,
  opts: GeneratorOptions,
  source?: { documentName: string; documentId: string }
): Recipe {
  // Parse recipe elements from document context
  const title = extractTitle(context, opts);
  const ingredients = extractIngredients(context, opts);
  const instructions = extractInstructions(context);
  const cuisine = opts.cuisine !== 'any' ? opts.cuisine : 'Italian';

  return {
    id: uuidv4(),
    title,
    description: `Recipe extracted from your uploaded documents and adapted for your preferences.`,
    cuisine,
    dietary: opts.dietary,
    prepTime: 20,
    cookTime: Math.min(opts.maxCookTime - 20, 40),
    servings: opts.servings,
    difficulty: opts.difficulty !== 'any' ? opts.difficulty : 'intermediate',
    imageUrl: CUISINE_IMAGES[cuisine] ?? 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=600&q=80',
    tags: [cuisine.toLowerCase(), ...opts.dietary],
    ingredients,
    instructions,
    substitutions: [],
    nutrition: { calories: 400, protein: 20, carbs: 45, fat: 15, fiber: 5, isEstimated: true },
    sourceDocumentId: source?.documentId,
    sourceDocumentName: source?.documentName,
    isDemo: false,
    isFavorite: false,
    createdAt: new Date().toISOString(),
  };
}

function extractTitle(context: string, opts: GeneratorOptions): string {
  const lines = context.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    if (line.length > 5 && line.length < 60 && !line.toLowerCase().startsWith('[context')) {
      return line.replace(/^#+\s*/, '').replace(/recipe$/i, '').trim() || 'Extracted Recipe';
    }
  }
  return opts.cuisine !== 'any' ? `${opts.cuisine} Style Recipe` : 'Custom Recipe';
}

function extractIngredients(context: string, opts: GeneratorOptions): Ingredient[] {
  const ingredients: Ingredient[] = [];

  // Add user-provided ingredients first
  opts.ingredients.forEach(ing => {
    ingredients.push({ name: ing, amount: '1', unit: 'portion', category: 'other' });
  });

  // Try to parse ingredient lines from context
  const lines = context.split('\n');
  let inIngredients = false;
  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('ingredient')) { inIngredients = true; continue; }
    if (lower.includes('instruction') || lower.includes('method') || lower.includes('step')) { inIngredients = false; }
    if (inIngredients && line.trim().length > 2) {
      const parsed = parseIngredientLine(line.trim());
      if (parsed) ingredients.push(parsed);
    }
  }

  return ingredients.length > 0 ? ingredients.slice(0, 10) : getDefaultIngredients(opts);
}

function parseIngredientLine(line: string): Ingredient | null {
  const match = line.match(/^(\d+(?:\.\d+)?(?:\/\d+)?)\s*([a-z]+(?:\s+[a-z]+)?)\s+(.+)/i);
  if (match) {
    return {
      amount: match[1],
      unit: match[2],
      name: match[3].replace(/,.*/, '').trim(),
      category: 'other',
    };
  }
  if (line.length < 60 && !line.includes(':')) {
    return { name: line, amount: '', unit: '', category: 'other' };
  }
  return null;
}

function getDefaultIngredients(opts: GeneratorOptions): Ingredient[] {
  return opts.ingredients.map(name => ({
    name,
    amount: '1',
    unit: 'cup',
    category: 'other' as const,
  }));
}

function extractInstructions(context: string): Instruction[] {
  const instructions: Instruction[] = [];
  const lines = context.split('\n').map(l => l.trim()).filter(Boolean);
  let stepNum = 1;
  let inInstructions = false;

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('instruction') || lower.includes('method') || lower.includes('step')) {
      inInstructions = true;
      continue;
    }
    if (inInstructions && line.length > 15) {
      instructions.push({
        step: stepNum++,
        text: line.replace(/^\d+\.\s*/, '').replace(/^step\s*\d+:?\s*/i, ''),
      });
      if (stepNum > 8) break;
    }
  }

  if (instructions.length === 0) {
    return [
      { step: 1, text: 'Prepare all ingredients as listed above.' },
      { step: 2, text: 'Follow the recipe instructions from your uploaded document for detailed preparation steps.' },
      { step: 3, text: 'Cook according to the extracted recipe guidelines and serve.' },
    ];
  }

  return instructions;
}
