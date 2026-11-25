import { useState } from 'react';
import { Sparkles, Plus, X, Loader2, AlertCircle, ChefHat, Clock } from 'lucide-react';
import type { GeneratorOptions, CuisineType, DietaryType, DifficultyLevel, Recipe } from '../../types';
import { generateRecipe } from '../../services/recipeGenerationService';
import { saveGeneratedRecipe } from '../../services/favoritesService';
import { Button } from '../ui/Button';
import { Select } from '../ui/Input';
import { Badge } from '../ui/Badge';

const CUISINES: CuisineType[] = [
  'Italian', 'Mexican', 'Indian', 'Asian', 'Mediterranean', 'American', 'French', 'Japanese', 'Thai', 'Greek'
];
const DIETARY_OPTIONS: { value: DietaryType; label: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian' },
  { value: 'vegan', label: 'Vegan' },
  { value: 'gluten-free', label: 'Gluten-Free' },
  { value: 'dairy-free', label: 'Dairy-Free' },
  { value: 'keto', label: 'Keto' },
  { value: 'low-carb', label: 'Low-Carb' },
  { value: 'sugar-free', label: 'Sugar-Free' },
  { value: 'nut-free', label: 'Nut-Free' },
];

interface RecipeGeneratorProps {
  onViewRecipe: (recipe: Recipe) => void;
}

export function RecipeGenerator({ onViewRecipe }: RecipeGeneratorProps) {
  const [ingredientInput, setIngredientInput] = useState('');
  const [options, setOptions] = useState<GeneratorOptions>({
    ingredients: [],
    cuisine: 'any',
    dietary: [],
    maxCookTime: 60,
    servings: 4,
    difficulty: 'any',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [generated, setGenerated] = useState<Recipe | null>(null);
  const [fromDocuments, setFromDocuments] = useState(false);

  function addIngredient() {
    const ing = ingredientInput.trim();
    if (!ing || options.ingredients.includes(ing)) return;
    setOptions(prev => ({ ...prev, ingredients: [...prev.ingredients, ing] }));
    setIngredientInput('');
  }

  function removeIngredient(ing: string) {
    setOptions(prev => ({ ...prev, ingredients: prev.ingredients.filter(i => i !== ing) }));
  }

  function toggleDietary(value: DietaryType) {
    setOptions(prev => ({
      ...prev,
      dietary: prev.dietary.includes(value) ? prev.dietary.filter(d => d !== value) : [...prev.dietary, value],
    }));
  }

  async function handleGenerate() {
    setLoading(true);
    setError('');
    setGenerated(null);

    try {
      const result = await generateRecipe(options);
      setGenerated(result.recipe);
      setFromDocuments(result.fromDocuments);
      saveGeneratedRecipe(result.recipe);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Recipe Generator</h1>
        <p className="text-gray-500 mt-1">Tell me what you have and I'll create a personalized recipe for you.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Options Panel */}
        <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Sparkles size={16} className="text-orange-500" />
            Your Preferences
          </h2>

          {/* Ingredients */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Available Ingredients</label>
            <div className="flex gap-2 mb-2">
              <input
                value={ingredientInput}
                onChange={e => setIngredientInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addIngredient(); } }}
                placeholder="e.g. chicken, tomatoes…"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              />
              <button
                onClick={addIngredient}
                className="p-2 rounded-lg bg-green-700 text-white hover:bg-green-800 transition-colors cursor-pointer"
                aria-label="Add ingredient"
              >
                <Plus size={16} />
              </button>
            </div>
            {options.ingredients.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {options.ingredients.map(ing => (
                  <span
                    key={ing}
                    className="inline-flex items-center gap-1 bg-green-50 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full border border-green-200"
                  >
                    {ing}
                    <button onClick={() => removeIngredient(ing)} className="hover:text-red-500 cursor-pointer">
                      <X size={11} />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Cuisine */}
          <Select
            label="Cuisine Preference"
            value={options.cuisine}
            onChange={e => setOptions(prev => ({ ...prev, cuisine: e.target.value as CuisineType | 'any' }))}
            options={[
              { value: 'any', label: 'Any Cuisine' },
              ...CUISINES.map(c => ({ value: c, label: c })),
            ]}
          />

          {/* Dietary */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Dietary Requirements</label>
            <div className="flex flex-wrap gap-2">
              {DIETARY_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => toggleDietary(opt.value)}
                  className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                    options.dietary.includes(opt.value)
                      ? 'bg-green-700 text-white border-green-700'
                      : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time and servings row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                <Clock size={13} className="inline mr-1" />
                Max Cook Time
              </label>
              <select
                value={options.maxCookTime}
                onChange={e => setOptions(prev => ({ ...prev, maxCookTime: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                <option value={15}>15 minutes</option>
                <option value={30}>30 minutes</option>
                <option value={45}>45 minutes</option>
                <option value={60}>1 hour</option>
                <option value={90}>1.5 hours</option>
                <option value={120}>2+ hours</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Servings</label>
              <select
                value={options.servings}
                onChange={e => setOptions(prev => ({ ...prev, servings: Number(e.target.value) }))}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
              >
                {[1, 2, 3, 4, 6, 8, 10].map(n => (
                  <option key={n} value={n}>{n} serving{n !== 1 ? 's' : ''}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Difficulty */}
          <Select
            label="Difficulty Level"
            value={options.difficulty}
            onChange={e => setOptions(prev => ({ ...prev, difficulty: e.target.value as DifficultyLevel | 'any' }))}
            options={[
              { value: 'any', label: 'Any Difficulty' },
              { value: 'beginner', label: 'Beginner' },
              { value: 'intermediate', label: 'Intermediate' },
              { value: 'advanced', label: 'Advanced' },
            ]}
          />

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            loading={loading}
            icon={<Sparkles size={15} />}
            size="lg"
            className="w-full"
          >
            Generate Recipe
          </Button>
        </div>

        {/* Result / Preview */}
        <div>
          {loading && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 flex flex-col items-center gap-4">
              <div className="w-14 h-14 bg-green-50 rounded-full flex items-center justify-center">
                <Loader2 size={24} className="text-green-700 animate-spin" />
              </div>
              <p className="text-gray-700 font-medium">Generating your recipe…</p>
              <p className="text-sm text-gray-500 text-center">Searching your documents and crafting the perfect recipe.</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="text-red-800 font-medium text-sm">Generation failed</p>
                <p className="text-red-600 text-sm mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && !generated && (
            <div className="bg-white rounded-xl border border-gray-200 p-10 flex flex-col items-center gap-4 text-center">
              <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center">
                <ChefHat size={28} className="text-orange-500" />
              </div>
              <div>
                <p className="font-semibold text-gray-800">Ready to create your recipe</p>
                <p className="text-sm text-gray-500 mt-1">Add ingredients and preferences, then hit Generate.</p>
              </div>
              <div className="text-xs text-gray-400 max-w-xs">
                💡 Upload recipe documents in the Knowledge Base to get recipes from your personal cookbook collection.
              </div>
            </div>
          )}

          {!loading && generated && (
            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <img
                src={generated.imageUrl}
                alt={generated.title}
                className="w-full h-40 object-cover"
                onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=600&q=80'; }}
              />
              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-bold text-gray-900 text-lg">{generated.title}</h3>
                  {fromDocuments ? (
                    <Badge variant="green">From Your Documents</Badge>
                  ) : (
                    <Badge variant="orange">Demo Recipe</Badge>
                  )}
                </div>
                <p className="text-sm text-gray-600 mb-3">{generated.description}</p>

                {generated.sourceDocumentName && (
                  <div className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 px-3 py-1.5 rounded-lg mb-3">
                    <ChefHat size={12} />
                    Source: {generated.sourceDocumentName}
                  </div>
                )}

                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-2 text-center mb-4">
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-sm font-bold text-gray-900">{generated.prepTime + generated.cookTime}m</div>
                    <div className="text-xs text-gray-500">Total Time</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-sm font-bold text-gray-900">{generated.servings}</div>
                    <div className="text-xs text-gray-500">Servings</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-2">
                    <div className="text-sm font-bold text-gray-900">{generated.nutrition.calories}</div>
                    <div className="text-xs text-gray-500">Cal/serving *est.</div>
                  </div>
                </div>

                {/* Ingredients preview */}
                <div className="mb-4">
                  <p className="text-xs font-semibold text-gray-700 uppercase tracking-wide mb-2">Ingredients ({generated.ingredients.length})</p>
                  <ul className="space-y-1">
                    {generated.ingredients.slice(0, 5).map((ing, i) => (
                      <li key={i} className="text-sm text-gray-700 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shrink-0" />
                        {ing.amount} {ing.unit} {ing.name}
                      </li>
                    ))}
                    {generated.ingredients.length > 5 && (
                      <li className="text-xs text-gray-400">+{generated.ingredients.length - 5} more…</li>
                    )}
                  </ul>
                </div>

                <Button
                  onClick={() => { onViewRecipe(generated); }}
                  className="w-full"
                  size="sm"
                  icon={<ChefHat size={14} />}
                >
                  View Full Recipe
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
