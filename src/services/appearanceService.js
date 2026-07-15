// Service to get and set the user's UI appearance preferences (theme and font size)

const THEME_KEY = 'appearanceTheme';
const FONT_SIZE_KEY = 'appearanceFontSize';

export const THEMES = ['light', 'dark'];
export const FONT_SIZES = ['small', 'medium', 'large', 'xlarge'];

const DEFAULT_THEME = 'light';
const DEFAULT_FONT_SIZE = 'medium';

export function getAppearanceSettings() {
  const storedTheme = localStorage.getItem(THEME_KEY);
  const storedFontSize = localStorage.getItem(FONT_SIZE_KEY);

  return {
    theme: THEMES.includes(storedTheme) ? storedTheme : DEFAULT_THEME,
    fontSize: FONT_SIZES.includes(storedFontSize) ? storedFontSize : DEFAULT_FONT_SIZE,
  };
}

export function setTheme(theme) {
  if (!THEMES.includes(theme)) return;
  localStorage.setItem(THEME_KEY, theme);
}

export function setFontSize(fontSize) {
  if (!FONT_SIZES.includes(fontSize)) return;
  localStorage.setItem(FONT_SIZE_KEY, fontSize);
}

export function clearAppearanceSettings() {
  localStorage.removeItem(THEME_KEY);
  localStorage.removeItem(FONT_SIZE_KEY);
}
