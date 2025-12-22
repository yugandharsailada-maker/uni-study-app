import { useState, useEffect, useCallback } from 'react';

const STORAGE_PREFIX = 'curriculum_form_';

export function useFormPersistence<T>(key: string, defaultValue: T) {
  const storageKey = `${STORAGE_PREFIX}${key}`;
  
  // Initialize from localStorage
  const [value, setValue] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('Failed to parse stored form data:', e);
    }
    return defaultValue;
  });

  // Persist to localStorage on change
  useEffect(() => {
    try {
      if (value !== defaultValue && JSON.stringify(value) !== JSON.stringify(defaultValue)) {
        localStorage.setItem(storageKey, JSON.stringify(value));
      } else {
        localStorage.removeItem(storageKey);
      }
    } catch (e) {
      console.warn('Failed to save form data:', e);
    }
  }, [value, defaultValue, storageKey]);

  // Clear persisted data
  const clearPersisted = useCallback(() => {
    localStorage.removeItem(storageKey);
    setValue(defaultValue);
  }, [storageKey, defaultValue]);

  return [value, setValue, clearPersisted] as const;
}

// Hook to clear all form persistence for a specific context
export function useClearFormPersistence() {
  return useCallback((keyPattern?: string) => {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith(STORAGE_PREFIX)) {
        if (!keyPattern || key.includes(keyPattern)) {
          keysToRemove.push(key);
        }
      }
    }
    keysToRemove.forEach(key => localStorage.removeItem(key));
  }, []);
}
