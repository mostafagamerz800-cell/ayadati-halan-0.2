import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

const KEY = 'ayadati-theme';

function readTheme(): 'light' | 'dark' {
  try {
    return localStorage.getItem(KEY) === 'dark' ? 'dark' : 'light';
  } catch {
    return 'light';
  }
}

export function ThemeToggle({inline=false}:{inline?:boolean}) {
  const [theme, setTheme] = useState<'light' | 'dark'>(readTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    try { localStorage.setItem(KEY, theme); } catch { /* local preference only */ }
  }, [theme]);
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={inline ? 'theme-toggle theme-toggle-inline' : 'theme-toggle'}
      onClick={() => setTheme(dark ? 'light' : 'dark')}
      aria-label={dark ? 'التبديل إلى الوضع الفاتح' : 'التبديل إلى الوضع الداكن'}
      title={dark ? 'الوضع الفاتح' : 'الوضع الداكن'}
    >
      {dark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
