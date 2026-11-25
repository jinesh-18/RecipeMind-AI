import { useState, useMemo } from 'react';
import { Heart, Clock, Search, Trash2, BookOpen } from 'lucide-react';
import type { Recipe } from '../../types';
import {
  getFavorites,
  getHistory,
  getGenerated,
  removeFavorite,
  toggleFavorite,
  addToHistory,
} from '../../services/favoritesService';
import { DEMO_RECIPES } from '../../data/demoData';
import { RecipeCard } from '../ui/RecipeCard';
import { Input } from '../ui/Input';

interface FavoritesHistoryProps {
  onViewRecipe: (recipe: Recipe) => void;
}

type Tab = 'favorites' | 'history' | 'generated' | 'all';

export function FavoritesHistory({ onViewRecipe }: FavoritesHistoryProps) {
  const [tab, setTab] = useState<Tab>('favorites');
  const [search, setSearch] = useState('');

  const favorites = useMemo(() => getFavorites(), [tab]);
  const history = useMemo(() => getHistory(), [tab]);
  const generated = useMemo(() => getGenerated(), [tab]);
  const allRecipes = useMemo(() => {
    const all = [...DEMO_RECIPES, ...generated];
    const seen = new Set<string>();
    return all.filter(r => { if (seen.has(r.id)) return false; seen.add(r.id); return true; });
  }, [tab]);

  const [favState, setFavState] = useState(() => getFavorites().map(r => r.id));

  function handleFavorite(recipe: Recipe) {
    const isFav = toggleFavorite(recipe);
    setFavState(isFav
      ? prev => [...prev, recipe.id]
      : prev => prev.filter(id => id !== recipe.id)
    );
  }

  const tabData: Record<Tab, Recipe[]> = {
    favorites,
    history,
    generated,
    all: allRecipes,
  };

  const filtered = tabData[tab].filter(r =>
    !search || r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisine.toLowerCase().includes(search.toLowerCase()) ||
    r.tags.some(t => t.toLowerCase().includes(search.toLowerCase()))
  );

  const TABS: { id: Tab; label: string; count: number }[] = [
    { id: 'favorites', label: 'Favorites', count: favorites.length },
    { id: 'history', label: 'Recently Viewed', count: history.length },
    { id: 'generated', label: 'Generated', count: generated.length },
    { id: 'all', label: 'All Recipes', count: allRecipes.length },
  ];

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Favorites & History</h1>
        <p className="text-gray-500 mt-1">Your saved and recently explored recipes.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit flex-wrap">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all cursor-pointer ${
              tab === t.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {t.id === 'favorites' && <Heart size={13} fill={tab === 'favorites' ? '#ef4444' : 'none'} className={tab === 'favorites' ? 'text-red-500' : ''} />}
            {t.id === 'history' && <Clock size={13} />}
            {t.label}
            <span className={`text-xs rounded-full px-1.5 py-0.5 ${tab === t.id ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'}`}>
              {t.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <Input
        placeholder={`Search ${tab === 'favorites' ? 'your favorites' : tab === 'history' ? 'recent recipes' : 'recipes'}…`}
        value={search}
        onChange={e => setSearch(e.target.value)}
        icon={<Search size={15} />}
        className="max-w-sm"
      />

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          {tab === 'favorites' ? (
            <>
              <Heart size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-700 font-medium">No favorites yet</p>
              <p className="text-gray-500 text-sm mt-1">Click the heart icon on any recipe to save it here.</p>
            </>
          ) : tab === 'history' ? (
            <>
              <Clock size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-700 font-medium">No recent recipes</p>
              <p className="text-gray-500 text-sm mt-1">Recipes you view will appear here.</p>
            </>
          ) : tab === 'generated' ? (
            <>
              <BookOpen size={48} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-700 font-medium">No generated recipes yet</p>
              <p className="text-gray-500 text-sm mt-1">Use the Recipe Generator to create custom recipes.</p>
            </>
          ) : (
            <p className="text-gray-500">No recipes found for "{search}"</p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(recipe => (
            <div key={recipe.id} className="relative">
              <RecipeCard
                recipe={recipe}
                onClick={() => { addToHistory(recipe); onViewRecipe(recipe); }}
                onFavorite={handleFavorite}
                isFavorite={favState.includes(recipe.id)}
              />
              {tab === 'favorites' && (
                <button
                  onClick={() => { removeFavorite(recipe.id); setFavState(prev => prev.filter(id => id !== recipe.id)); }}
                  className="absolute top-2 left-2 w-6 h-6 rounded-full bg-white/90 hover:bg-red-50 flex items-center justify-center transition-colors cursor-pointer"
                  title="Remove from favorites"
                >
                  <Trash2 size={11} className="text-gray-500 hover:text-red-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
