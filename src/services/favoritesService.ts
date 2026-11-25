/**
 * Favorites Service
 * Manages favorite and recently viewed recipes with localStorage persistence.
 */

import type { Recipe } from '../types';
import { DEMO_RECIPES } from '../data/demoData';

const FAV_KEY = 'recipemind_favorites';
const HISTORY_KEY = 'recipemind_history';
const GENERATED_KEY = 'recipemind_generated';

function loadFavorites(): Recipe[] {
  try {
    const stored = localStorage.getItem(FAV_KEY);
    if (!stored) {
      const defaults = DEMO_RECIPES.filter(r => r.isFavorite);
      localStorage.setItem(FAV_KEY, JSON.stringify(defaults));
      return defaults;
    }
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

function loadHistory(): Recipe[] {
  try {
    const stored = localStorage.getItem(HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function loadGenerated(): Recipe[] {
  try {
    const stored = localStorage.getItem(GENERATED_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function getFavorites(): Recipe[] {
  return loadFavorites();
}

export function getHistory(): Recipe[] {
  return loadHistory().slice(0, 20);
}

export function getGenerated(): Recipe[] {
  return loadGenerated().slice(0, 50);
}

export function toggleFavorite(recipe: Recipe): boolean {
  const favorites = loadFavorites();
  const idx = favorites.findIndex(f => f.id === recipe.id);
  if (idx >= 0) {
    favorites.splice(idx, 1);
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
    return false;
  } else {
    favorites.unshift({ ...recipe, isFavorite: true });
    localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
    return true;
  }
}

export function isFavorite(recipeId: string): boolean {
  return loadFavorites().some(f => f.id === recipeId);
}

export function addToHistory(recipe: Recipe): void {
  const history = loadHistory();
  const filtered = history.filter(h => h.id !== recipe.id);
  filtered.unshift({ ...recipe, viewedAt: new Date().toISOString() });
  localStorage.setItem(HISTORY_KEY, JSON.stringify(filtered.slice(0, 20)));
}

export function saveGeneratedRecipe(recipe: Recipe): void {
  const generated = loadGenerated();
  const filtered = generated.filter(g => g.id !== recipe.id);
  filtered.unshift({ ...recipe, createdAt: new Date().toISOString() });
  localStorage.setItem(GENERATED_KEY, JSON.stringify(filtered.slice(0, 50)));
}

export function removeFavorite(recipeId: string): void {
  const favorites = loadFavorites().filter(f => f.id !== recipeId);
  localStorage.setItem(FAV_KEY, JSON.stringify(favorites));
}

export function getAllRecipes(): Recipe[] {
  const favorites = loadFavorites();
  const generated = loadGenerated();
  const all = [...DEMO_RECIPES, ...generated];
  const seen = new Set<string>();
  return all.filter(r => {
    if (seen.has(r.id)) return false;
    seen.add(r.id);
    return true;
  }).map(r => ({
    ...r,
    isFavorite: favorites.some(f => f.id === r.id),
  }));
}
