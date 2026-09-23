"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { Button } from "@/components/atoms/button";

export function ThemeToggle(): React.ReactElement {
  const { resolvedTheme, setTheme } = useTheme();
  const isMounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
  if (!isMounted)
    return (
      <Button aria-label="Toggle color theme" variant="outline">
        Theme
      </Button>
    );
  const isDark = resolvedTheme === "dark";
  return (
    <Button
      aria-label="Toggle color theme"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      variant="outline"
    >
      {isDark ? <Sun aria-hidden="true" size={16} /> : <Moon aria-hidden="true" size={16} />}
      <span className="ml-2">Theme</span>
    </Button>
  );
}
