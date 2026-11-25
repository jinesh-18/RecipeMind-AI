import { useState, useCallback } from 'react';
import type { NavSection, Recipe } from './types';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './components/pages/Dashboard';
import { KnowledgeBase } from './components/pages/KnowledgeBase';
import { AIAssistant } from './components/pages/AIAssistant';
import { RecipeGenerator } from './components/pages/RecipeGenerator';
import { RecipeDetail } from './components/pages/RecipeDetail';
import { ShoppingListPage } from './components/pages/ShoppingListPage';
import { FavoritesHistory } from './components/pages/FavoritesHistory';
import { SettingsPage } from './components/pages/SettingsPage';

export default function App() {
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [viewingRecipe, setViewingRecipe] = useState<Recipe | null>(null);
  const [recipeReturnSection, setRecipeReturnSection] = useState<NavSection>('dashboard');

  const handleNavigate = useCallback((section: NavSection) => {
    setViewingRecipe(null);
    setActiveSection(section);
  }, []);

  const handleViewRecipe = useCallback((recipe: Recipe) => {
    setRecipeReturnSection(activeSection);
    setViewingRecipe(recipe);
  }, [activeSection]);

  const handleBackFromRecipe = useCallback(() => {
    setViewingRecipe(null);
  }, [recipeReturnSection]);

  function renderContent() {
    if (viewingRecipe) {
      return (
        <RecipeDetail
          recipe={viewingRecipe}
          onBack={handleBackFromRecipe}
          onNavigate={handleNavigate}
        />
      );
    }

    switch (activeSection) {
      case 'dashboard':
        return <Dashboard onNavigate={handleNavigate} onViewRecipe={handleViewRecipe} />;
      case 'knowledge-base':
        return <KnowledgeBase />;
      case 'assistant':
        return <AIAssistant onViewRecipe={handleViewRecipe} />;
      case 'generator':
        return <RecipeGenerator onViewRecipe={handleViewRecipe} />;
      case 'shopping-list':
        return <ShoppingListPage />;
      case 'favorites':
        return <FavoritesHistory onViewRecipe={handleViewRecipe} />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <Dashboard onNavigate={handleNavigate} onViewRecipe={handleViewRecipe} />;
    }
  }

  // AI Assistant needs full height layout
  const isFullHeight = activeSection === 'assistant' && !viewingRecipe;

  return (
    <div className="flex min-h-screen bg-[#fefdf8]">
      <Sidebar
        activeSection={viewingRecipe ? recipeReturnSection : activeSection}
        onNavigate={handleNavigate}
      />
      <main
        className={`flex-1 min-w-0 pt-14 lg:pt-0 ${isFullHeight ? 'flex flex-col overflow-hidden' : 'overflow-y-auto'}`}
        style={isFullHeight ? { height: '100vh' } : undefined}
      >
        <div className={isFullHeight ? 'flex-1 flex flex-col overflow-hidden' : ''}>
          {renderContent()}
        </div>
      </main>
    </div>
  );
}
