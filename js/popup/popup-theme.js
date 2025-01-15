// popup-theme.js

/**
 * This file manages the theme functionality for the popup interface.
 * It provides a function to apply and persist a theme ('light' or 'dark').
 */

/** Applies the given theme to the popup.
 * @param {string} theme - The theme to apply ('light' or 'dark').
 */
export function applyTheme(theme) {
  console.log('Applying Theme:', theme);
  document.body.classList.remove('light', 'dark'); // Remove existing theme classes
  document.body.classList.add(theme); // Add the selected theme
  localStorage.setItem('theme', theme); // Save the preference
  console.log('Theme Saved to Local Storage:', localStorage.getItem('theme'));
}
