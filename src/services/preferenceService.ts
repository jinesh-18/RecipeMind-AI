/**
 * Preference Service
 * Manages user preferences with localStorage persistence.
 */

import type { UserPreferences } from '../types';
import { DEFAULT_PREFERENCES } from '../data/demoData';

const STORAGE_KEY = 'recipemind_preferences';

export function getPreferences(): UserPreferences {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(prefs: UserPreferences): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
}

export function updatePreferences(partial: Partial<UserPreferences>): UserPreferences {
  const current = getPreferences();
  const updated = { ...current, ...partial };
  savePreferences(updated);
  return updated;
}
