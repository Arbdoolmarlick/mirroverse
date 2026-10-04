import {
  createContext,
  useContext,
  useEffect,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

export type ThemeMode = "light" | "dark";
export type ThemeOrigin = { x: number; y: number };

type ThemeContextType = {
  theme: ThemeMode;
  toggleTheme: (origin?: ThemeOrigin) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [themeTransition, setThemeTransition] = useState<{
    mode: ThemeMode;
    origin: ThemeOrigin;
  } | null>(null);

  useEffect(() => {
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("mirro-theme") : null;
    const initialTheme: ThemeMode = saved === "dark" ? "dark" : "light";
    setTheme(initialTheme);
    document.documentElement.dataset.theme = initialTheme;
    if (initialTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = (origin?: ThemeOrigin) => {
    const nextTheme: ThemeMode = theme === "light" ? "dark" : "light";
    const clickOrigin = origin || {
      x: typeof window !== "undefined" ? window.innerWidth / 2 : 0,
      y: typeof window !== "undefined" ? window.innerHeight / 2 : 0,
    };

    setThemeTransition({ mode: nextTheme, origin: clickOrigin });

    window.setTimeout(() => {
      setTheme(nextTheme);
      document.documentElement.dataset.theme = nextTheme;
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
      if (typeof window !== "undefined") {
        window.localStorage.setItem("mirro-theme", nextTheme);
      }
      setThemeTransition(null);
    }, 760);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
      {themeTransition && (
        <div
          className={`theme-transition theme-transition-${themeTransition.mode}`}
          style={
            {
              "--theme-x": `${themeTransition.origin.x}px`,
              "--theme-y": `${themeTransition.origin.y}px`,
            } as CSSProperties
          }
          aria-hidden="true"
        />
      )}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
