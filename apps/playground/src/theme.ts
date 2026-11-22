import type { ThemeMode } from "@gvejs/themes";

const themeKey = "gve-theme";
const themeEvent = "gve-theme-change";

export function getTheme(): ThemeMode {
  const theme = document.documentElement.dataset.theme;
  return theme === "dark" || theme === "light" ? theme : "auto";
}

export function subscribeTheme(update: () => void) {
  window.addEventListener(themeEvent, update);
  return () => window.removeEventListener(themeEvent, update);
}

export function initializeTheme(select: HTMLSelectElement) {
  function apply(theme: string | null) {
    document.documentElement.dataset.theme = theme ?? "auto";
    select.value = getTheme();
    window.dispatchEvent(new Event(themeEvent));
  }
  try {
    apply(localStorage.getItem(themeKey));
  } catch {
    apply(null);
  }
  select.addEventListener("change", () => {
    apply(select.value);
    try {
      localStorage.setItem(themeKey, select.value);
    } catch {
      // The selected theme still works for the current page.
    }
  });
}
