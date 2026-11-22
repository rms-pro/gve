export type ThemeMode = 'light' | 'dark' | 'auto';
export interface Theme {
  mode: ThemeMode;
  colors: Partial<Record<'surface' | 'canvas' | 'text' | 'muted' | 'border' | 'accent' | 'active' | 'focus', string>>;
}
