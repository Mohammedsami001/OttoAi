"use client";

import { useId, useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Switch } from "./switch";
import { cn } from "../../lib/utils";
import { MoonIcon, SunIcon } from "lucide-react";

export function SwitchToggleTheme() {
  const id = useId();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="h-6 w-[72px]" />; // Placeholder to prevent layout shift
  }

  const isDark = theme === "dark" || theme === "system";

  return (
    <div className="group inline-flex items-center gap-2">
      <span
        id={`${id}-light`}
        className={cn(
          "cursor-pointer text-left text-sm font-medium",
          isDark && "text-foreground/50"
        )}
        aria-controls={id}
        onClick={() => setTheme("light")}
      >
        <SunIcon className="size-4" aria-hidden="true" />
      </span>

      <Switch
        id={id}
        checked={isDark}
        onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
        aria-labelledby={`${id}-light ${id}-dark`}
        aria-label="Toggle between dark and light mode"
        className="data-[state=unchecked]:bg-black data-[state=checked]:bg-white"
      />

      <span
        id={`${id}-dark`}
        className={cn(
          "cursor-pointer text-right text-sm font-medium",
          isDark || "text-foreground/50"
        )}
        aria-controls={id}
        onClick={() => setTheme("dark")}
      >
        <MoonIcon className="size-4" aria-hidden="true" />
      </span>
    </div>
  );
}
