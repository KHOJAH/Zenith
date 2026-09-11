import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { palette, ThemeColors, ThemeMode } from '@/theme/colors';
import { getItem, setItem, STORAGE_KEYS } from '@/utils/storage';

interface ThemeContextType {
  mode: 'light' | 'dark' | 'system';
  resolvedMode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<'light' | 'dark' | 'system'>('light');

  // Load persisted theme on mount
  useEffect(() => {
    getItem(STORAGE_KEYS.THEME_MODE, 'light').then((saved) => {
      if (saved === 'light' || saved === 'dark' || saved === 'system') {
        setModeState(saved);
      }
    });
  }, []);

  const setMode = useCallback((newMode: 'light' | 'dark' | 'system') => {
    setModeState(newMode);
    setItem(STORAGE_KEYS.THEME_MODE, newMode);
  }, []);

  const toggleTheme = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      setItem(STORAGE_KEYS.THEME_MODE, next);
      return next;
    });
  }, []);

  const resolvedMode: ThemeMode =
    mode === 'system'
      ? systemScheme === 'dark'
        ? 'dark'
        : 'light'
      : mode;

  const colors = palette[resolvedMode];
  const isDark = resolvedMode === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        mode,
        resolvedMode,
        colors,
        isDark,
        setMode,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
