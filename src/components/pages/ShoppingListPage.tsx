import { useState } from 'react';
import { Trash2, CheckCircle, Plus, X, ShoppingBag } from 'lucide-react';
import {
  getShoppingList,
  togglePurchased,
  removeItem,
  clearPurchased,
  clearAll,
  addItem,
  groupByCategory,
  CATEGORY_LABELS,
} from '../../services/shoppingListService';
import type { ShoppingList, IngredientCategory } from '../../types';
import { Button } from '../ui/Button';

export function ShoppingListPage() {
  const [list, setList] = useState<ShoppingList>(() => getShoppingList());
  const [newItemName, setNewItemName] = useState('');
  const [newItemAmount, setNewItemAmount] = useState('');
  const [newItemUnit, setNewItemUnit] = useState('');
  const [newItemCategory, setNewItemCategory] = useState<IngredientCategory>('other');

  function handleToggle(itemId: string) {
    setList(togglePurchased(itemId));
  }

  function handleRemove(itemId: string) {
    setList(removeItem(itemId));
  }

  function handleClearPurchased() {
    setList(clearPurchased());
  }

  function handleClearAll() {
    if (!confirm('Clear the entire shopping list?')) return;
    setList(clearAll());
  }

  function handleAddItem(e: React.FormEvent) {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setList(addItem(newItemName.trim(), newItemAmount, newItemUnit, newItemCategory));
    setNewItemName('');
    setNewItemAmount('');
    setNewItemUnit('');
  }

  const pending = list.items.filter(i => !i.purchased);
  const purchased = list.items.filter(i => i.purchased);
  const grouped = groupByCategory(pending);
  const categoryKeys = Object.keys(grouped) as IngredientCategory[];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shopping List</h1>
          <p className="text-gray-500 mt-1">
            {pending.length} item{pending.length !== 1 ? 's' : ''} to buy
            {purchased.length > 0 && ` · ${purchased.length} purchased`}
          </p>
        </div>
        <div className="flex gap-2">
          {purchased.length > 0 && (
            <Button variant="outline" size="sm" icon={<CheckCircle size={14} />} onClick={handleClearPurchased}>
              Clear Purchased
            </Button>
          )}
          {list.items.length > 0 && (
            <Button variant="danger" size="sm" icon={<Trash2 size={14} />} onClick={handleClearAll}>
              Clear All
            </Button>
          )}
        </div>
      </div>

      {/* Add Item Form */}
      <form onSubmit={handleAddItem} className="bg-white rounded-xl border border-gray-200 p-4">
        <h2 className="font-semibold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <Plus size={15} className="text-green-700" />
          Add Item
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <input
            value={newItemName}
            onChange={e => setNewItemName(e.target.value)}
            placeholder="Item name"
            className="sm:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            required
          />
          <input
            value={newItemAmount}
            onChange={e => setNewItemAmount(e.target.value)}
            placeholder="Amount"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
          <input
            value={newItemUnit}
            onChange={e => setNewItemUnit(e.target.value)}
            placeholder="Unit (g, cup…)"
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          />
        </div>
        <div className="flex gap-2 mt-2">
          <select
            value={newItemCategory}
            onChange={e => setNewItemCategory(e.target.value as IngredientCategory)}
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
          >
            {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <Button type="submit" size="sm" icon={<Plus size={14} />}>
            Add
          </Button>
        </div>
      </form>

      {/* Empty State */}
      {list.items.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <ShoppingBag size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-700 font-medium">Your shopping list is empty</p>
          <p className="text-gray-500 text-sm mt-1">
            Add items above or add all ingredients from a recipe's detail page.
          </p>
        </div>
      )}

      {/* Pending Items — grouped by category */}
      {categoryKeys.length > 0 && (
        <div className="space-y-4">
          {categoryKeys.map(cat => (
            <div key={cat} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
              <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
                <h3 className="text-sm font-semibold text-gray-700">
                  {CATEGORY_LABELS[cat]} <span className="text-gray-400 font-normal">({grouped[cat].length})</span>
                </h3>
              </div>
              <ul className="divide-y divide-gray-100">
                {grouped[cat].map(item => (
                  <li key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors">
                    <button
                      onClick={() => handleToggle(item.id)}
                      className="w-5 h-5 rounded border-2 border-gray-300 flex items-center justify-center hover:border-green-500 transition-colors cursor-pointer shrink-0"
                      aria-label="Mark as purchased"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm text-gray-900">{item.name}</span>
                      {(item.amount || item.unit) && (
                        <span className="text-xs text-gray-400 ml-2">{item.amount} {item.unit}</span>
                      )}
                      {item.recipeName && (
                        <span className="text-xs text-green-600 ml-2">· {item.recipeName}</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 rounded text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      aria-label="Remove item"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {/* Purchased Items */}
      {purchased.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden opacity-70">
          <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
            <h3 className="text-sm font-semibold text-gray-500">
              ✓ Purchased ({purchased.length})
            </h3>
          </div>
          <ul className="divide-y divide-gray-100">
            {purchased.map(item => (
              <li key={item.id} className="flex items-center gap-3 px-4 py-2.5">
                <button
                  onClick={() => handleToggle(item.id)}
                  className="w-5 h-5 rounded bg-green-500 flex items-center justify-center cursor-pointer shrink-0"
                  aria-label="Unmark as purchased"
                >
                  <CheckCircle size={12} className="text-white" />
                </button>
                <span className="flex-1 text-sm text-gray-400 line-through">{item.name}</span>
                <button
                  onClick={() => handleRemove(item.id)}
                  className="p-1.5 rounded text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
                >
                  <X size={14} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
