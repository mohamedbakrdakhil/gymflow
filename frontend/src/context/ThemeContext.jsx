/**
 * ThemeContext — gère dark/light + couleurs custom de la salle (white-label)
 */
import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

function hexToHsl(hex) {
  hex = hex.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function ThemeProvider({ children, gym }) {
  const [mode, setMode] = useState(() => localStorage.getItem('gymflow_theme') || 'light');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
    localStorage.setItem('gymflow_theme', mode);
  }, [mode]);

  useEffect(() => {
    if (gym?.primary_color) {
      document.documentElement.style.setProperty('--primary', hexToHsl(gym.primary_color));
      document.documentElement.style.setProperty('--ring', hexToHsl(gym.primary_color));
    }
    if (gym?.secondary_color) {
      document.documentElement.style.setProperty('--secondary', hexToHsl(gym.secondary_color));
    }
  }, [gym?.primary_color, gym?.secondary_color]);

  return (
    <ThemeContext.Provider value={{ mode, setMode, toggle: () => setMode(mode === 'light' ? 'dark' : 'light') }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
