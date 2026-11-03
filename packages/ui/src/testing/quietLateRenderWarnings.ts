const LATE_RENDER = 'not wrapped in act(';

/**
 * Stops React's warning about an update outside `act()` reaching the console, and lets everything
 * else through.
 *
 * On a loaded CI runner, work a component left for later — Motion finishing an animation, a Radix
 * ref or popover settling, React flushing its own effects — finishes between two steps of a test,
 * and React warns about each update. On a developer's machine the same tests finish first and print
 * nothing. A release run printed some hundred and fifty of them, none from a test doing anything
 * wrong, and they buried the one failure that mattered.
 *
 * @param console - The console to quiet.
 */
const quietLateRenderWarnings = (console: Pick<Console, 'error'>): void => {
  const report = console.error.bind(console);

  console.error = (...said: Parameters<Console['error']>) => {
    if (typeof said[0] === 'string' && said[0].includes(LATE_RENDER)) {
      return;
    }

    report(...said);
  };
};

export { quietLateRenderWarnings };
