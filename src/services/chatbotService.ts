/**
 * Chatbot Service
 * Handles natural language Q&A about recipes using the RAG pipeline.
 * Local demo engine — interface designed for IBM Granite replacement.
 */

import { v4 as uuidv4 } from 'uuid';
import type { ChatMessage, Recipe, SourceReference } from '../types';
import { retrieve, buildContext } from './retrievalService';
import { DEMO_RECIPES } from '../data/demoData';

export interface ChatResponse {
  message: ChatMessage;
  relatedRecipes?: Recipe[];
}

type IntentType =
  | 'ingredient_search'
  | 'dietary_search'
  | 'time_search'
  | 'adaptation'
  | 'substitution'
  | 'explanation'
  | 'general';

interface ParsedIntent {
  type: IntentType;
  keywords: string[];
  dietary?: string[];
  maxTime?: number;
  servings?: number;
  ingredients?: string[];
}

export async function chat(userMessage: string, _history: ChatMessage[]): Promise<ChatResponse> {
  const intent = parseIntent(userMessage);
  const { chunks, sources } = retrieve(userMessage, 5);
  const context = buildContext(chunks);

  const hasDocumentContext = context.length > 100;
  const content = generateResponse(userMessage, intent, context, hasDocumentContext, sources);
  const relatedRecipes = findRelatedRecipes(intent, userMessage);

  const message: ChatMessage = {
    id: uuidv4(),
    role: 'assistant',
    content,
    timestamp: new Date().toISOString(),
    sourceDocuments: hasDocumentContext ? sources : undefined,
    recipes: relatedRecipes.length > 0 ? relatedRecipes.slice(0, 2) : undefined,
  };

  return { message, relatedRecipes };
}

function parseIntent(message: string): ParsedIntent {
  const lower = message.toLowerCase();

  // Detect ingredients
  const ingredientWords = extractIngredients(lower);

  // Detect dietary preferences
  const dietaryKeywords = ['vegan', 'vegetarian', 'gluten-free', 'dairy-free', 'keto', 'sugar-free'];
  const dietary = dietaryKeywords.filter(d => lower.includes(d));

  // Detect time constraint
  const timeMatch = lower.match(/(\d+)\s*min(?:utes?)?/);
  const maxTime = timeMatch ? parseInt(timeMatch[1]) : undefined;

  // Detect servings adaptation
  const servingsMatch = lower.match(/(\d+)\s*(?:people|persons?|servings?|portions?)/);
  const servings = servingsMatch ? parseInt(servingsMatch[1]) : undefined;

  // Classify intent
  let type: IntentType = 'general';
  if (ingredientWords.length > 0) type = 'ingredient_search';
  else if (dietary.length > 0) type = 'dietary_search';
  else if (maxTime) type = 'time_search';
  else if (lower.includes('adapt') || lower.includes('adjust') || lower.includes('scale')) type = 'adaptation';
  else if (lower.includes('substitute') || lower.includes('replace') || lower.includes('instead of') || lower.includes('without')) type = 'substitution';
  else if (lower.includes('how') || lower.includes('explain') || lower.includes('what is') || lower.includes('technique')) type = 'explanation';

  return {
    type,
    keywords: message.toLowerCase().split(/\s+/).filter(w => w.length > 3),
    dietary,
    maxTime,
    servings,
    ingredients: ingredientWords,
  };
}

function extractIngredients(text: string): string[] {
  const commonIngredients = [
    'potato', 'tomato', 'onion', 'garlic', 'chicken', 'beef', 'pork', 'fish', 'salmon', 'shrimp',
    'pasta', 'rice', 'bread', 'cheese', 'egg', 'milk', 'butter', 'flour', 'sugar', 'salt',
    'pepper', 'basil', 'oregano', 'thyme', 'rosemary', 'cumin', 'paprika', 'ginger',
    'carrot', 'celery', 'spinach', 'broccoli', 'mushroom', 'lemon', 'lime', 'olive oil',
    'beans', 'lentils', 'avocado', 'cucumber', 'zucchini', 'eggplant', 'corn',
  ];
  return commonIngredients.filter(ing => text.includes(ing));
}

function findRelatedRecipes(intent: ParsedIntent, query: string): Recipe[] {
  const queryLower = query.toLowerCase();
  return DEMO_RECIPES.filter(recipe => {
    const titleLower = recipe.title.toLowerCase();
    const tagMatch = recipe.tags.some(t => queryLower.includes(t));
    const cuisineMatch = queryLower.includes(recipe.cuisine.toLowerCase());
    const ingredientMatch = intent.ingredients?.some(ing =>
      recipe.ingredients.some(i => i.name.toLowerCase().includes(ing))
    );
    const dietaryMatch = intent.dietary?.every(d => recipe.dietary.includes(d as never));
    const timeMatch = !intent.maxTime || (recipe.prepTime + recipe.cookTime) <= intent.maxTime;
    const titleMatch = titleLower.split(' ').some(word => queryLower.includes(word) && word.length > 3);

    return (tagMatch || cuisineMatch || ingredientMatch || dietaryMatch || titleMatch) && timeMatch;
  });
}

function generateResponse(
  query: string,
  intent: ParsedIntent,
  context: string,
  hasContext: boolean,
  sources: SourceReference[]
): string {
  const sourceNote = hasContext
    ? `\n\n📚 *Found relevant content in: ${sources.map(s => `"${s.documentName}"`).join(', ')}*`
    : '\n\n💡 *Answering from general culinary knowledge — upload recipe documents to get document-grounded answers.*';

  if (hasContext) {
    return generateContextualResponse(query, intent, context) + sourceNote;
  }

  return generateDemoResponse(query, intent) + sourceNote;
}

function generateContextualResponse(_query: string, intent: ParsedIntent, context: string): string {
  const lines = context.split('\n').filter(l => l.trim().length > 10).slice(0, 10);

  switch (intent.type) {
    case 'ingredient_search':
      return `Based on your uploaded recipes, here's what I found for cooking with ${intent.ingredients?.join(', ')}:\n\n${lines.slice(0, 5).join('\n')}\n\nCheck the recipe cards below for complete details.`;

    case 'dietary_search':
      return `Looking through your recipe documents for ${intent.dietary?.join(' and ')} options:\n\n${lines.slice(0, 5).join('\n')}\n\nI've surfaced matching recipes below.`;

    case 'substitution':
      return `From your uploaded documents, here are relevant substitution notes:\n\n${lines.slice(0, 6).join('\n')}\n\nFor general substitutions, ask me specifically about an ingredient.`;

    default:
      return `Here's what I found in your recipe documents:\n\n${lines.slice(0, 6).join('\n')}\n\nSee the recipe cards below for the full recipes.`;
  }
}

function generateDemoResponse(query: string, intent: ParsedIntent): string {
  const q = query.toLowerCase();

  if (intent.type === 'ingredient_search' && intent.ingredients && intent.ingredients.length > 0) {
    const ingredients = intent.ingredients.slice(0, 3).join(', ');
    return `With **${ingredients}**, here are some great options:\n\n` +
      `• **Quick Stir-Fry** — sauté your vegetables with garlic, soy sauce, and sesame oil over high heat. Ready in 15 minutes.\n` +
      `• **Simple Soup** — simmer ingredients in broth with herbs for 30 minutes for a comforting meal.\n` +
      `• **Roasted Medley** — toss with olive oil, salt, and herbs, roast at 200°C for 25 minutes.\n\n` +
      `Upload recipe documents to get specific recipes from your personal cookbook collection!`;
  }

  if (intent.type === 'dietary_search') {
    return `For **${intent.dietary?.join(' and ')}** recipes, I recommend:\n\n` +
      `• Focusing on whole grains, legumes, and fresh vegetables as your base.\n` +
      `• Using herbs and spices generously to add flavor without compromising dietary needs.\n` +
      `• The recipe cards below show options that match your dietary requirements.\n\n` +
      `Upload your own recipe documents to search your personal collection.`;
  }

  if (intent.type === 'time_search') {
    return `For recipes under **${intent.maxTime} minutes**, here are my top strategies:\n\n` +
      `• **15 min**: Pasta aglio e olio, egg fried rice, quesadillas\n` +
      `• **20 min**: Stir-fries, quick salads with grilled protein, wraps\n` +
      `• **30 min**: One-pan chicken, quick curries, pasta dishes\n\n` +
      `The recipe cards below are filtered to match your time constraint.`;
  }

  if (intent.type === 'adaptation') {
    const servings = intent.servings;
    if (servings) {
      return `To adapt a recipe for **${servings} people**, simply scale all ingredient amounts proportionally.\n\n` +
        `**Key scaling tips:**\n` +
        `• Multiply all ingredients by your target servings ÷ original servings\n` +
        `• Don't scale seasonings linearly — add salt and spices gradually to taste\n` +
        `• Cooking time only changes slightly — check doneness rather than relying solely on time\n` +
        `• For baked goods, adjust pan size accordingly`;
    }
    return `To adapt a recipe, I need to know:\n1. Which recipe you want to adapt\n2. For how many servings\n3. Any dietary changes needed\n\nAsk me something like "Adapt the margherita pizza for 2 people" or "Make the tikka masala dairy-free".`;
  }

  if (intent.type === 'substitution') {
    if (q.includes('dairy') || q.includes('milk') || q.includes('butter') || q.includes('cream')) {
      return `**Dairy Substitutes:**\n\n` +
        `• **Butter** → Vegan butter, olive oil, or applesauce (in baking)\n` +
        `• **Milk** → Oat milk, almond milk, or soy milk (1:1 ratio)\n` +
        `• **Heavy cream** → Full-fat coconut cream or cashew cream\n` +
        `• **Cheese** → Nutritional yeast, vegan cheese, or omit\n` +
        `• **Yogurt** → Coconut yogurt or silken tofu`;
    }
    if (q.includes('egg')) {
      return `**Egg Substitutes (per egg):**\n\n` +
        `• **Binding**: 1 tbsp flaxseed + 3 tbsp water (flax egg)\n` +
        `• **Leavening**: 1 tsp baking soda + 1 tbsp vinegar\n` +
        `• **Moisture**: 60g unsweetened applesauce or mashed banana\n` +
        `• **Commercial**: JUST Egg or similar liquid egg alternatives`;
    }
    return `I can help with substitutions! Tell me specifically which ingredient you need to replace.\n\n` +
      `For example:\n• "What can I use instead of heavy cream?"\n• "Replace eggs in baking"\n• "Dairy-free alternatives for butter"`;
  }

  if (intent.type === 'explanation') {
    if (q.includes('al dente')) {
      return `**Al dente** (Italian for "to the tooth") means pasta cooked until it's tender but still has a slight firmness when you bite through it.\n\n` +
        `**How to achieve it:**\n1. Use a large pot of well-salted boiling water\n2. Cook 1-2 minutes less than the package time\n3. Taste frequently in the last few minutes\n4. The pasta should have no raw flour taste, but slight resistance in the center`;
    }
    if (q.includes('mise en place')) {
      return `**Mise en place** (French for "everything in its place") is the culinary practice of preparing and organizing all ingredients before cooking.\n\n` +
        `**Why it matters:**\n• Prevents overcooking while searching for ingredients\n• Reduces stress and mistakes\n• Ensures smooth, efficient cooking flow\n• Professional kitchens use this for every dish`;
    }
    return `That's a great cooking question! For the most accurate answer, please upload relevant recipe documents and I can search them for you.\n\n` +
      `You can also ask me about specific techniques like:\n• "What is blanching?"\n• "How does braising work?"\n• "Explain the Maillard reaction"`;
  }

  // General greeting/chat
  if (q.includes('hello') || q.includes('hi') || q.includes('hey')) {
    return `Hello! 👨‍🍳 I'm RecipeMind AI, your intelligent cooking assistant.\n\n` +
      `Here's what I can help you with:\n` +
      `• **Find recipes** — "What can I cook with chicken and tomatoes?"\n` +
      `• **Dietary needs** — "Show me vegan pasta recipes"\n` +
      `• **Quick meals** — "Recipes under 30 minutes"\n` +
      `• **Substitutions** — "Replace dairy in this recipe"\n` +
      `• **Techniques** — "How do I make a roux?"\n\n` +
      `Upload your recipe documents in the **Knowledge Base** to search your own cookbook collection!`;
  }

  return `I understand you're asking about "${query}". Let me help!\n\n` +
    `For the best results:\n` +
    `• **Upload recipe documents** in the Knowledge Base section — I'll search them for you\n` +
    `• **Use the Recipe Generator** to create custom recipes based on your ingredients\n` +
    `• **Be specific** — mention ingredients, cuisine, or dietary preferences\n\n` +
    `Try asking: "What can I make with potatoes and onions?" or "Give me a quick Italian dinner idea."`;
}
