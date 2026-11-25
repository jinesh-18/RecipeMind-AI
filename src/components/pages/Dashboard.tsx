import React, { useMemo } from 'react';
import {
  BookOpen, ChefHat, Heart, ShoppingCart, Sparkles, Clock,
  TrendingUp, ArrowRight, Flame
} from 'lucide-react';
import type { NavSection } from '../../types';
import { DEMO_RECIPES } from '../../data/demoData';
import { getDocuments } from '../../services/documentService';
import { getFavorites, getHistory } from '../../services/favoritesService';
import { getShoppingList } from '../../services/shoppingListService';
import { RecipeCard } from '../ui/RecipeCard';
import { Button } from '../ui/Button';
import { toggleFavorite, isFavorite } from '../../services/favoritesService';
import { addToHistory } from '../../services/favoritesService';

interface DashboardProps {
  onNavigate: (section: NavSection) => void;
  onViewRecipe: (recipe: import('../../types').Recipe) => void;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const ACTIVITY = [3, 1, 4, 2, 5, 3, 6];

function StatCard({ icon, label, value, color, onClick }: {
  icon: React.ReactNode; label: string; value: number | string; color: string; onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4 ${onClick ? 'cursor-pointer hover:border-green-300 hover:shadow-sm transition-all' : ''}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-500">{label}</div>
      </div>
    </div>
  );
}

export function Dashboard({ onNavigate, onViewRecipe }: DashboardProps) {
  const docs = useMemo(() => getDocuments(), []);
  const favorites = useMemo(() => getFavorites(), []);
  const history = useMemo(() => getHistory(), []);
  const shoppingList = useMemo(() => getShoppingList(), []);

  const totalRecipes = docs.reduce((sum, d) => sum + d.recipeCount, 0) + DEMO_RECIPES.length;
  const pendingItems = shoppingList.items.filter(i => !i.purchased).length;

  const recentRecipes = history.length > 0 ? history.slice(0, 4) : DEMO_RECIPES.slice(0, 4);
  const suggested = DEMO_RECIPES.filter(r => !recentRecipes.some(rr => rr.id === r.id)).slice(0, 3);

  const maxActivity = Math.max(...ACTIVITY);

  function handleFavorite(recipe: import('../../types').Recipe) {
    toggleFavorite(recipe);
  }

  function handleViewRecipe(recipe: import('../../types').Recipe) {
    addToHistory(recipe);
    onViewRecipe(recipe);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{greeting}, Chef! 👨‍🍳</h1>
          <p className="text-gray-500 mt-1">Your AI-powered cooking assistant is ready to help.</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<BookOpen size={15} />}
            onClick={() => onNavigate('knowledge-base')}
          >
            Upload Cookbook
          </Button>
          <Button
            size="sm"
            icon={<Sparkles size={15} />}
            onClick={() => onNavigate('generator')}
          >
            Generate Recipe
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<BookOpen size={20} className="text-green-700" />}
          label="Cookbooks Uploaded"
          value={docs.length}
          color="bg-green-50"
          onClick={() => onNavigate('knowledge-base')}
        />
        <StatCard
          icon={<ChefHat size={20} className="text-orange-500" />}
          label="Recipes Discovered"
          value={totalRecipes}
          color="bg-orange-50"
          onClick={() => onNavigate('favorites')}
        />
        <StatCard
          icon={<Heart size={20} className="text-red-500" />}
          label="Favorite Recipes"
          value={favorites.length}
          color="bg-red-50"
          onClick={() => onNavigate('favorites')}
        />
        <StatCard
          icon={<ShoppingCart size={20} className="text-blue-500" />}
          label="Shopping Items"
          value={pendingItems}
          color="bg-blue-50"
          onClick={() => onNavigate('shopping-list')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Recipes */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Recipes</h2>
            <button
              onClick={() => onNavigate('favorites')}
              className="text-sm text-green-700 hover:text-green-900 flex items-center gap-1 cursor-pointer"
            >
              View all <ArrowRight size={14} />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recentRecipes.slice(0, 4).map(recipe => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onClick={() => handleViewRecipe(recipe)}
                onFavorite={handleFavorite}
                isFavorite={isFavorite(recipe.id)}
                compact
              />
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Activity Chart */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp size={16} className="text-green-700" />
              <h3 className="font-semibold text-gray-900 text-sm">Weekly Cooking Activity</h3>
            </div>
            <div className="flex items-end gap-2 h-24">
              {ACTIVITY.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full bg-green-100 rounded-t-sm transition-all"
                    style={{ height: `${(count / maxActivity) * 80}px`, backgroundColor: i === 6 ? '#1f5020' : '#dceedc' }}
                  />
                  <span className="text-xs text-gray-400">{DAYS[i]}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-500 flex items-center gap-1">
              <Flame size={12} className="text-orange-500" />
              <span>24 recipes cooked this month</span>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 text-sm mb-3">Quick Actions</h3>
            <div className="space-y-2">
              {[
                { label: 'Ask the AI Assistant', icon: <ChefHat size={14} />, section: 'assistant' as NavSection },
                { label: 'Generate a Recipe', icon: <Sparkles size={14} />, section: 'generator' as NavSection },
                { label: 'View Shopping List', icon: <ShoppingCart size={14} />, section: 'shopping-list' as NavSection },
                { label: 'Upload a Cookbook', icon: <BookOpen size={14} />, section: 'knowledge-base' as NavSection },
              ].map(action => (
                <button
                  key={action.section}
                  onClick={() => onNavigate(action.section)}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-green-50 hover:text-green-800 transition-colors cursor-pointer text-left"
                >
                  <span className="text-green-600">{action.icon}</span>
                  {action.label}
                  <ArrowRight size={12} className="ml-auto text-gray-400" />
                </button>
              ))}
            </div>
          </div>

          {/* Suggested Recipes */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={14} className="text-orange-500" />
              <h3 className="font-semibold text-gray-900 text-sm">Quick Suggestions</h3>
            </div>
            <div className="space-y-2">
              {suggested.map(recipe => (
                <button
                  key={recipe.id}
                  onClick={() => handleViewRecipe(recipe)}
                  className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer text-left"
                >
                  <img
                    src={recipe.imageUrl}
                    alt={recipe.title}
                    className="w-10 h-10 rounded-lg object-cover shrink-0"
                    onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=600&q=80'; }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 truncate">{recipe.title}</div>
                    <div className="text-xs text-gray-500">{recipe.prepTime + recipe.cookTime}m · {recipe.cuisine}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
