import React, { createContext, useContext, useState, useEffect } from 'react';

export type ThemeType = 'system' | 'dark' | 'light' | 'pi-signature';

interface ThemeContextType {
  theme: ThemeType;
  resolvedTheme: 'dark' | 'light' | 'pi-signature';
  setTheme: (theme: ThemeType) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeType>(() => {
    const stored = localStorage.getItem('pi_marketplace_theme');
    return (stored as ThemeType) || 'dark'; // Dark remains default
  });

  const [resolvedTheme, setResolvedTheme] = useState<'dark' | 'light' | 'pi-signature'>('dark');

  const setTheme = (newTheme: ThemeType) => {
    setThemeState(newTheme);
    localStorage.setItem('pi_marketplace_theme', newTheme);
  };

  useEffect(() => {
    const handleThemeChange = () => {
      let activeTheme: 'dark' | 'light' | 'pi-signature' = 'dark';

      if (theme === 'system') {
        const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        activeTheme = isSystemDark ? 'dark' : 'light';
      } else {
        activeTheme = theme as 'dark' | 'light' | 'pi-signature';
      }

      setResolvedTheme(activeTheme);

      // Apply data-theme attribute and CSS classes on document.documentElement
      const root = document.documentElement;
      
      // Remove all theme classes
      root.classList.remove('theme-dark', 'theme-light', 'theme-pi-signature');
      root.removeAttribute('data-theme');

      // Add appropriate class and attribute
      root.classList.add(`theme-${activeTheme}`);
      root.setAttribute('data-theme', activeTheme);
    };

    handleThemeChange();

    // Listen to system changes if system theme selected
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const listener = () => handleThemeChange();
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
