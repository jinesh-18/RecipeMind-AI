import { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Heart, Clock, Users, ChefHat, ShoppingCart, Printer,
  CheckSquare, Square, Timer, Plus, Minus, Star, BookOpen
} from 'lucide-react';
import type { Recipe } from '../../types';
import { toggleFavorite, isFavorite, addToHistory } from '../../services/favoritesService';
import { addRecipeIngredients } from '../../services/shoppingListService';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';

interface RecipeDetailProps {
  recipe: Recipe;
  onBack: () => void;
  onNavigate?: (section: import('../../types').NavSection) => void;
}

const DIFFICULTY_COLOR = {
  beginner: 'green' as const,
  intermediate: 'orange' as const,
  advanced: 'red' as const,
};

export function RecipeDetail({ recipe, onBack }: RecipeDetailProps) {
  const [servings, setServings] = useState(recipe.servings);
  const ratio = servings / recipe.servings;
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [favorite, setFavorite] = useState(() => isFavorite(recipe.id));
  const [addedToList, setAddedToList] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);
  const [timerLabel, setTimerLabel] = useState('');
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    addToHistory(recipe);
  }, [recipe.id]);

  useEffect(() => {
    if (timerActive && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            setTimerActive(false);
            clearInterval(timerRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerActive]);

  function startTimer(seconds: number, label: string) {
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerSeconds(seconds);
    setTimerLabel(label);
    setTimerActive(true);
  }

  function stopTimer() {
    setTimerActive(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }

  function handleFavorite() {
    const newState = toggleFavorite(recipe);
    setFavorite(newState);
  }

  function handleAddToShoppingList() {
    addRecipeIngredients({ ...recipe, servings, ingredients: recipe.ingredients.map(ing => {
      const amount = parseFloat(ing.amount);
      if (isNaN(amount)) return ing;
      return { ...ing, amount: (amount * ratio).toFixed(ratio < 1 ? 1 : 0) };
    })});
    setAddedToList(true);
    setTimeout(() => setAddedToList(false), 2500);
  }

  function handlePrint() {
    window.print();
  }

  function formatTime(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div className="max-w-4xl mx-auto p-4 lg:p-6 space-y-6 pb-12">
      {/* Back */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
      >
        <ArrowLeft size={15} /> Back to recipes
      </button>

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden" style={{ height: '280px' }}>
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=600&q=80'; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        <div className="absolute bottom-4 left-5 right-5">
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="green">{recipe.cuisine}</Badge>
            <Badge variant={DIFFICULTY_COLOR[recipe.difficulty]}>{recipe.difficulty}</Badge>
            {recipe.dietary.map(d => <Badge key={d} variant="gray">{d}</Badge>)}
            {recipe.isDemo && <Badge variant="orange">Demo</Badge>}
          </div>
          <h1 className="text-white text-2xl lg:text-3xl font-bold">{recipe.title}</h1>
          {recipe.sourceDocumentName && (
            <div className="flex items-center gap-1.5 text-green-300 text-xs mt-1">
              <BookOpen size={12} />
              From: {recipe.sourceDocumentName}
            </div>
          )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleFavorite}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-colors cursor-pointer ${
            favorite ? 'bg-red-50 border-red-300 text-red-600' : 'bg-white border-gray-300 text-gray-700 hover:border-red-300'
          }`}
        >
          <Heart size={15} fill={favorite ? 'currentColor' : 'none'} />
          {favorite ? 'Saved' : 'Save'}
        </button>
        <Button
          variant="outline"
          size="sm"
          icon={<ShoppingCart size={14} />}
          onClick={handleAddToShoppingList}
        >
          {addedToList ? '✓ Added!' : 'Add to List'}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          icon={<Printer size={14} />}
          onClick={handlePrint}
        >
          Print
        </Button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: 'Prep Time', value: `${recipe.prepTime}m`, icon: <Clock size={16} className="text-green-700" /> },
          { label: 'Cook Time', value: `${recipe.cookTime}m`, icon: <Timer size={16} className="text-orange-500" /> },
          { label: 'Total Time', value: `${totalTime}m`, icon: <Clock size={16} className="text-blue-500" /> },
          { label: 'Calories', value: `${recipe.nutrition.calories}*`, icon: <Star size={16} className="text-yellow-500" /> },
        ].map(stat => (
          <div key={stat.label} className="bg-white rounded-xl border border-gray-200 p-3 text-center">
            <div className="flex justify-center mb-1">{stat.icon}</div>
            <div className="font-bold text-gray-900">{stat.value}</div>
            <div className="text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Description */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <p className="text-gray-700 leading-relaxed">{recipe.description}</p>
        {recipe.nutrition.isEstimated && (
          <p className="text-xs text-gray-400 mt-2">* Nutritional values are estimates and may vary.</p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Ingredients */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            {/* Serving adjuster */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                <Users size={16} className="text-green-700" />
                Ingredients
              </h2>
              <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setServings(Math.max(1, servings - 1))}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                  aria-label="Decrease servings"
                >
                  <Minus size={12} />
                </button>
                <span className="text-sm font-semibold text-gray-900 w-8 text-center">{servings}</span>
                <button
                  onClick={() => setServings(servings + 1)}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-white transition-colors cursor-pointer"
                  aria-label="Increase servings"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            <ul className="space-y-2">
              {recipe.ingredients.map((ing, i) => {
                const amount = parseFloat(ing.amount);
                const scaled = isNaN(amount) ? ing.amount : (amount * ratio).toFixed(ratio < 1 ? 1 : 0);
                const checked = checkedIngredients.has(i);
                return (
                  <li
                    key={i}
                    onClick={() => setCheckedIngredients(prev => {
                      const next = new Set(prev);
                      next.has(i) ? next.delete(i) : next.add(i);
                      return next;
                    })}
                    className={`flex items-center gap-2.5 py-1.5 cursor-pointer rounded px-1 hover:bg-gray-50 transition-colors ${checked ? 'opacity-50' : ''}`}
                  >
                    {checked ? <CheckSquare size={16} className="text-green-600 shrink-0" /> : <Square size={16} className="text-gray-400 shrink-0" />}
                    <span className={`text-sm ${checked ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                      <span className="font-medium">{scaled} {ing.unit}</span> {ing.name}
                      {ing.optional && <span className="text-gray-400 ml-1">(optional)</span>}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Nutrition */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 text-sm mb-3">
              Nutrition per serving {recipe.nutrition.isEstimated && <span className="text-gray-400 font-normal">(estimated)</span>}
            </h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Calories', value: `${recipe.nutrition.calories}`, unit: 'kcal' },
                { label: 'Protein', value: `${recipe.nutrition.protein}`, unit: 'g' },
                { label: 'Carbs', value: `${recipe.nutrition.carbs}`, unit: 'g' },
                { label: 'Fat', value: `${recipe.nutrition.fat}`, unit: 'g' },
                { label: 'Fiber', value: `${recipe.nutrition.fiber}`, unit: 'g' },
              ].map(n => (
                <div key={n.label} className="bg-gray-50 rounded-lg p-2 text-center">
                  <div className="text-sm font-bold text-gray-900">{n.value}<span className="text-xs text-gray-500 ml-0.5">{n.unit}</span></div>
                  <div className="text-xs text-gray-500">{n.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Substitutions */}
          {recipe.substitutions.length > 0 && (
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <h2 className="font-semibold text-gray-900 text-sm mb-3">Substitutions</h2>
              <div className="space-y-2">
                {recipe.substitutions.map((sub, i) => (
                  <div key={i} className="bg-orange-50 rounded-lg p-2.5">
                    <div className="text-xs">
                      <span className="text-gray-600">Replace </span>
                      <span className="font-medium text-gray-900">{sub.original}</span>
                      <span className="text-gray-600"> with </span>
                      <span className="font-medium text-orange-700">{sub.substitute}</span>
                    </div>
                    {sub.note && <div className="text-xs text-gray-500 mt-0.5">{sub.note}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="lg:col-span-3 space-y-4">
          {/* Timer Widget */}
          {timerSeconds > 0 && (
            <div className="bg-green-700 text-white rounded-xl p-4 flex items-center justify-between">
              <div>
                <div className="text-xs text-green-200 mb-0.5">{timerLabel}</div>
                <div className="text-3xl font-bold font-mono">{formatTime(timerSeconds)}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setTimerActive(!timerActive)}
                  className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  {timerActive ? 'Pause' : 'Resume'}
                </button>
                <button
                  onClick={stopTimer}
                  className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  Stop
                </button>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h2 className="font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <ChefHat size={16} className="text-orange-500" />
              Instructions
            </h2>
            <div className="space-y-4">
              {recipe.instructions.map((step) => {
                const done = checkedSteps.has(step.step);
                return (
                  <div
                    key={step.step}
                    className={`flex gap-4 cursor-pointer group ${done ? 'opacity-60' : ''}`}
                    onClick={() => setCheckedSteps(prev => {
                      const next = new Set(prev);
                      next.has(step.step) ? next.delete(step.step) : next.add(step.step);
                      return next;
                    })}
                  >
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 font-bold text-sm transition-colors ${
                      done ? 'bg-green-600 text-white' : 'bg-green-100 text-green-800 group-hover:bg-green-200'
                    }`}>
                      {done ? '✓' : step.step}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className={`text-sm leading-relaxed ${done ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {step.text}
                      </p>
                      {step.tip && (
                        <div className="mt-1.5 flex items-start gap-1.5 bg-orange-50 rounded-lg p-2">
                          <span className="text-orange-500 text-xs">💡</span>
                          <p className="text-xs text-orange-700">{step.tip}</p>
                        </div>
                      )}
                      {step.duration && !done && (
                        <button
                          onClick={(e) => { e.stopPropagation(); startTimer(step.duration!, `Step ${step.step}`); }}
                          className="mt-1.5 flex items-center gap-1.5 text-xs text-green-700 hover:text-green-900 transition-colors cursor-pointer"
                        >
                          <Timer size={12} /> Set timer ({Math.floor(step.duration / 60)}m)
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
