/**
 * Shopping List Service
 * Manages shopping list items with localStorage persistence.
 */

import { v4 as uuidv4 } from 'uuid';
import type { ShoppingList, ShoppingListItem, Recipe, IngredientCategory } from '../types';
import { DEMO_SHOPPING_LIST } from '../data/demoData';

const STORAGE_KEY = 'recipemind_shopping_list';

export function getShoppingList(): ShoppingList {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : DEMO_SHOPPING_LIST;
  } catch {
    return DEMO_SHOPPING_LIST;
  }
}

function saveList(list: ShoppingList): void {
  list.updatedAt = new Date().toISOString();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function addItem(
  name: string,
  amount: string,
  unit: string,
  category: IngredientCategory = 'other',
  recipeId?: string,
  recipeName?: string
): ShoppingList {
  const list = getShoppingList();
  // Check for duplicate by name (case-insensitive)
  const exists = list.items.some(i => i.name.toLowerCase() === name.toLowerCase() && !i.purchased);
  if (!exists) {
    list.items.push({
      id: uuidv4(),
      name,
      amount,
      unit,
      category,
      purchased: false,
      recipeId,
      recipeName,
      addedAt: new Date().toISOString(),
    });
  }
  saveList(list);
  return list;
}

export function addRecipeIngredients(recipe: Recipe): ShoppingList {
  const list = getShoppingList();
  recipe.ingredients.forEach(ing => {
    const exists = list.items.some(i => i.name.toLowerCase() === ing.name.toLowerCase() && !i.purchased);
    if (!exists) {
      list.items.push({
        id: uuidv4(),
        name: ing.name,
        amount: ing.amount,
        unit: ing.unit,
        category: ing.category,
        purchased: false,
        recipeId: recipe.id,
        recipeName: recipe.title,
        addedAt: new Date().toISOString(),
      });
    }
  });
  saveList(list);
  return list;
}

export function removeItem(itemId: string): ShoppingList {
  const list = getShoppingList();
  list.items = list.items.filter(i => i.id !== itemId);
  saveList(list);
  return list;
}

export function togglePurchased(itemId: string): ShoppingList {
  const list = getShoppingList();
  list.items = list.items.map(i =>
    i.id === itemId ? { ...i, purchased: !i.purchased } : i
  );
  saveList(list);
  return list;
}

export function clearPurchased(): ShoppingList {
  const list = getShoppingList();
  list.items = list.items.filter(i => !i.purchased);
  saveList(list);
  return list;
}

export function clearAll(): ShoppingList {
  const list = { ...DEMO_SHOPPING_LIST, items: [], id: uuidv4(), createdAt: new Date().toISOString() };
  saveList(list);
  return list;
}

export function groupByCategory(items: ShoppingListItem[]): Record<string, ShoppingListItem[]> {
  const groups: Record<string, ShoppingListItem[]> = {};
  items.forEach(item => {
    const cat = item.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  });
  return groups;
}

export const CATEGORY_LABELS: Record<IngredientCategory, string> = {
  produce: '🥦 Produce',
  protein: '🥩 Protein',
  dairy: '🧀 Dairy',
  grains: '🌾 Grains & Bread',
  spices: '🌿 Spices & Herbs',
  condiments: '🫙 Condiments & Oils',
  canned: '🥫 Canned & Jarred',
  frozen: '❄️ Frozen',
  bakery: '🍞 Bakery',
  beverages: '🥤 Beverages',
  other: '🛒 Other',
};
