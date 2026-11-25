import { ChefHat, Heart, Clock, Users, Star } from 'lucide-react';
import type { Recipe } from '../../types';
import { Badge } from './Badge';

interface RecipeCardProps {
  recipe: Recipe;
  onClick?: () => void;
  onFavorite?: (recipe: Recipe) => void;
  isFavorite?: boolean;
  compact?: boolean;
}

const difficultyColors = {
  beginner: 'green' as const,
  intermediate: 'orange' as const,
  advanced: 'red' as const,
};

export function RecipeCard({ recipe, onClick, onFavorite, isFavorite, compact = false }: RecipeCardProps) {
  const totalTime = recipe.prepTime + recipe.cookTime;

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border border-gray-200 hover:border-green-300 hover:shadow-md transition-all duration-200 overflow-hidden cursor-pointer group ${compact ? '' : ''}`}
    >
      {/* Image */}
      <div className="relative overflow-hidden" style={{ height: compact ? '140px' : '180px' }}>
        <img
          src={recipe.imageUrl}
          alt={recipe.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1495195134817-aeb325a55b65?w=600&q=80';
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Favorite button */}
        {onFavorite && (
          <button
            onClick={(e) => { e.stopPropagation(); onFavorite(recipe); }}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
              isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-600 hover:bg-red-50 hover:text-red-500'
            }`}
            aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Heart size={15} fill={isFavorite ? 'currentColor' : 'none'} />
          </button>
        )}

        {/* Demo badge */}
        {recipe.isDemo && (
          <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs font-medium px-2 py-0.5 rounded-full">
            Demo
          </span>
        )}

        {/* Cuisine badge */}
        <span className="absolute bottom-2 left-2 bg-white/90 text-gray-700 text-xs font-medium px-2 py-0.5 rounded-full">
          {recipe.cuisine}
        </span>
      </div>

      {/* Content */}
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-2 mb-1">
          {recipe.title}
        </h3>
        {!compact && (
          <p className="text-xs text-gray-500 line-clamp-2 mb-2">{recipe.description}</p>
        )}

        {/* Dietary tags */}
        {recipe.dietary.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {recipe.dietary.slice(0, 2).map(d => (
              <Badge key={d} variant="green" size="xs">{d}</Badge>
            ))}
          </div>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-gray-500">
          <span className="flex items-center gap-1">
            <Clock size={12} />
            {totalTime}m
          </span>
          <span className="flex items-center gap-1">
            <Users size={12} />
            {recipe.servings}
          </span>
          <span className="flex items-center gap-1">
            <ChefHat size={12} />
            <Badge variant={difficultyColors[recipe.difficulty]} size="xs">
              {recipe.difficulty}
            </Badge>
          </span>
          <span className="flex items-center gap-1 ml-auto">
            <Star size={12} className="text-orange-400 fill-orange-400" />
            <span className="text-orange-500 font-medium">{recipe.nutrition.calories} cal</span>
          </span>
        </div>
      </div>
    </div>
  );
}
