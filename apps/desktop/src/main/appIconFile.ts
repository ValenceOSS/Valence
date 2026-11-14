/**
 * Which of the round Windows icons to show Valence with, from what was chosen on this computer and
 * whether the system is in dark mode.
 *
 * @param chosen - The kept choice: light, dark, or anything else to follow the system.
 * @param isSystemDark - Whether the system is in dark mode.
 * @returns The icon's file, inside the app.
 */
const appIconFile = (chosen: string | null, isSystemDark: boolean): string =>
  chosen === 'dark' || (chosen !== 'light' && isSystemDark)
    ? 'build/icon-win-dark.png'
    : 'build/icon-win.png';

export { appIconFile };
