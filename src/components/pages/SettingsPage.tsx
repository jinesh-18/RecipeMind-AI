import { useState } from 'react';
import { Save, User, Utensils, Globe, Settings2, ChefHat, Info } from 'lucide-react';
import type { UserPreferences, DietaryType, CuisineType, DifficultyLevel } from '../../types';
import { getPreferences, savePreferences } from '../../services/preferenceService';
import { Button } from '../ui/Button';

const DIETARY_OPTIONS: { value: DietaryType; label: string; desc: string }[] = [
  { value: 'vegetarian', label: 'Vegetarian', desc: 'No meat or fish' },
  { value: 'vegan', label: 'Vegan', desc: 'No animal products' },
  { value: 'gluten-free', label: 'Gluten-Free', desc: 'No gluten grains' },
  { value: 'dairy-free', label: 'Dairy-Free', desc: 'No milk products' },
  { value: 'keto', label: 'Keto', desc: 'High fat, low carb' },
  { value: 'low-carb', label: 'Low-Carb', desc: 'Reduced carbohydrates' },
  { value: 'sugar-free', label: 'Sugar-Free', desc: 'No added sugars' },
  { value: 'nut-free', label: 'Nut-Free', desc: 'No tree nuts or peanuts' },
];

const CUISINE_OPTIONS: CuisineType[] = [
  'Italian', 'Mexican', 'Indian', 'Asian', 'Mediterranean', 'American', 'French', 'Japanese', 'Thai', 'Greek', 'Spanish', 'Middle Eastern'
];

const GOALS = ['Try new cuisines', 'Healthier meals', 'Quick weekday dinners', 'Meal prep', 'Budget cooking', 'Learn new techniques', 'Reduce food waste'];

export function SettingsPage() {
  const [prefs, setPrefs] = useState<UserPreferences>(() => getPreferences());
  const [saved, setSaved] = useState(false);
  const [allergyInput, setAllergyInput] = useState('');

  function toggleDietary(value: DietaryType) {
    setPrefs(prev => ({
      ...prev,
      dietary: prev.dietary.includes(value) ? prev.dietary.filter(d => d !== value) : [...prev.dietary, value],
    }));
  }

  function toggleCuisine(value: CuisineType) {
    setPrefs(prev => ({
      ...prev,
      cuisines: prev.cuisines.includes(value) ? prev.cuisines.filter(c => c !== value) : [...prev.cuisines, value],
    }));
  }

  function toggleGoal(goal: string) {
    setPrefs(prev => ({
      ...prev,
      cookingGoals: prev.cookingGoals.includes(goal) ? prev.cookingGoals.filter(g => g !== goal) : [...prev.cookingGoals, goal],
    }));
  }

  function addAllergy() {
    const a = allergyInput.trim();
    if (!a || prefs.allergies.includes(a)) return;
    setPrefs(prev => ({ ...prev, allergies: [...prev.allergies, a] }));
    setAllergyInput('');
  }

  function removeAllergy(a: string) {
    setPrefs(prev => ({ ...prev, allergies: prev.allergies.filter(x => x !== a) }));
  }

  function handleSave() {
    savePreferences(prefs);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-500 mt-1">Personalize your RecipeMind AI experience.</p>
        </div>
        <Button
          onClick={handleSave}
          size="sm"
          icon={<Save size={14} />}
          variant={saved ? 'secondary' : 'primary'}
        >
          {saved ? '✓ Saved!' : 'Save Changes'}
        </Button>
      </div>

      {/* Dietary Preferences */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Utensils size={16} className="text-green-700" />
          <h2 className="font-semibold text-gray-900">Dietary Preferences</h2>
        </div>
        <p className="text-sm text-gray-500">Select all that apply. The AI Assistant and Recipe Generator will respect these.</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {DIETARY_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => toggleDietary(opt.value)}
              className={`flex flex-col items-start px-3 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                prefs.dietary.includes(opt.value)
                  ? 'bg-green-700 border-green-700 text-white'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-green-400'
              }`}
            >
              <span className="text-sm font-medium">{opt.label}</span>
              <span className={`text-xs mt-0.5 ${prefs.dietary.includes(opt.value) ? 'text-green-200' : 'text-gray-400'}`}>{opt.desc}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Preferred Cuisines */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Globe size={16} className="text-green-700" />
          <h2 className="font-semibold text-gray-900">Preferred Cuisines</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {CUISINE_OPTIONS.map(cuisine => (
            <button
              key={cuisine}
              onClick={() => toggleCuisine(cuisine)}
              className={`text-sm font-medium px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                prefs.cuisines.includes(cuisine)
                  ? 'bg-green-700 text-white border-green-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-green-400'
              }`}
            >
              {cuisine}
            </button>
          ))}
        </div>
      </div>

      {/* Cooking Setup */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <ChefHat size={16} className="text-green-700" />
          <h2 className="font-semibold text-gray-900">Cooking Setup</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Default Servings</label>
            <select
              value={prefs.defaultServings}
              onChange={e => setPrefs(prev => ({ ...prev, defaultServings: Number(e.target.value) }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              {[1, 2, 3, 4, 6, 8].map(n => <option key={n} value={n}>{n} serving{n !== 1 ? 's' : ''}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Skill Level</label>
            <select
              value={prefs.skillLevel}
              onChange={e => setPrefs(prev => ({ ...prev, skillLevel: e.target.value as DifficultyLevel }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Allergies */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <Settings2 size={16} className="text-green-700" />
          <h2 className="font-semibold text-gray-900">Allergies & Restrictions</h2>
        </div>
        <div className="flex gap-2">
          <input
            value={allergyInput}
            onChange={e => setAllergyInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addAllergy(); } }}
            placeholder="e.g. shellfish, peanuts…"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <Button variant="outline" size="sm" onClick={addAllergy}>Add</Button>
        </div>
        {prefs.allergies.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {prefs.allergies.map(a => (
              <span key={a} className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 text-xs font-medium px-2.5 py-1 rounded-full border border-red-200">
                {a}
                <button onClick={() => removeAllergy(a)} className="hover:text-red-900 cursor-pointer">×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Cooking Goals */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <User size={16} className="text-green-700" />
          <h2 className="font-semibold text-gray-900">Cooking Goals</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {GOALS.map(goal => (
            <button
              key={goal}
              onClick={() => toggleGoal(goal)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
                prefs.cookingGoals.includes(goal)
                  ? 'bg-orange-500 text-white border-orange-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-orange-400'
              }`}
            >
              {goal}
            </button>
          ))}
        </div>
      </div>

      {/* IBM Integration Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <Info size={18} className="text-blue-500 shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-blue-800">IBM Integration</p>
          <p className="text-sm text-blue-700 mt-0.5">
            This app is designed to integrate with IBM Granite and IBM watsonx Orchestrate. 
            See <code className="bg-blue-100 px-1 rounded text-xs">src/integration/INTEGRATION_GUIDE.md</code> for setup instructions.
          </p>
        </div>
      </div>

      {/* Save Button */}
      <Button onClick={handleSave} icon={<Save size={15} />} size="lg" className="w-full" variant={saved ? 'secondary' : 'primary'}>
        {saved ? '✓ Preferences Saved!' : 'Save Preferences'}
      </Button>
    </div>
  );
}
