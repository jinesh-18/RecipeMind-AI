// Core domain types for RecipeMind AI

export interface RecipeDocument {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'docx';
  size: number;
  uploadedAt: string;
  status: 'processing' | 'ready' | 'error';
  chunks: TextChunk[];
  recipeCount: number;
  errorMessage?: string;
}

export interface TextChunk {
  id: string;
  documentId: string;
  documentName: string;
  content: string;
  index: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  cuisine: CuisineType;
  dietary: DietaryType[];
  prepTime: number; // minutes
  cookTime: number; // minutes
  servings: number;
  difficulty: DifficultyLevel;
  ingredients: Ingredient[];
  instructions: Instruction[];
  substitutions: Substitution[];
  nutrition: NutritionInfo;
  imageUrl: string;
  tags: string[];
  sourceDocumentId?: string;
  sourceDocumentName?: string;
  isDemo?: boolean;
  isFavorite?: boolean;
  createdAt: string;
  viewedAt?: string;
}

export interface Ingredient {
  name: string;
  amount: string;
  unit: string;
  category: IngredientCategory;
  optional?: boolean;
}

export interface Instruction {
  step: number;
  text: string;
  duration?: number; // seconds
  tip?: string;
}

export interface Substitution {
  original: string;
  substitute: string;
  note?: string;
}

export interface NutritionInfo {
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  fiber: number; // g
  isEstimated: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sourceDocuments?: SourceReference[];
  recipes?: Recipe[];
  isStreaming?: boolean;
}

export interface SourceReference {
  documentId: string;
  documentName: string;
  relevance: number;
  excerpt: string;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  amount: string;
  unit: string;
  category: IngredientCategory;
  purchased: boolean;
  recipeId?: string;
  recipeName?: string;
  addedAt: string;
}

export interface ShoppingList {
  id: string;
  name: string;
  items: ShoppingListItem[];
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  dietary: DietaryType[];
  cuisines: CuisineType[];
  defaultServings: number;
  skillLevel: DifficultyLevel;
  allergies: string[];
  dislikedIngredients: string[];
  cookingGoals: string[];
}

export interface GeneratorOptions {
  ingredients: string[];
  cuisine: CuisineType | 'any';
  dietary: DietaryType[];
  maxCookTime: number;
  servings: number;
  difficulty: DifficultyLevel | 'any';
}

export interface DashboardStats {
  totalDocuments: number;
  totalRecipes: number;
  favoriteRecipes: number;
  shoppingItems: number;
}

export type CuisineType =
  | 'Italian'
  | 'Mexican'
  | 'Indian'
  | 'Asian'
  | 'Mediterranean'
  | 'American'
  | 'French'
  | 'Middle Eastern'
  | 'Japanese'
  | 'Thai'
  | 'Greek'
  | 'Spanish';

export type DietaryType =
  | 'vegetarian'
  | 'vegan'
  | 'gluten-free'
  | 'dairy-free'
  | 'keto'
  | 'paleo'
  | 'nut-free'
  | 'low-sodium'
  | 'low-carb'
  | 'sugar-free';

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

export type IngredientCategory =
  | 'produce'
  | 'protein'
  | 'dairy'
  | 'grains'
  | 'spices'
  | 'condiments'
  | 'canned'
  | 'frozen'
  | 'bakery'
  | 'beverages'
  | 'other';

export type NavSection =
  | 'dashboard'
  | 'knowledge-base'
  | 'assistant'
  | 'generator'
  | 'shopping-list'
  | 'favorites'
  | 'settings';
