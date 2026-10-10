import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';
import { withAWayBackToTheTvLayout } from './withAWayBackToTheTvLayout';

const PAGE =
  '<html><body><div id="root"></div><script type="module" src="/a.js"></script></body></html>';

type Trial = { endsAt: number; keep: () => void; goBack: () => void };

/**
 * Runs the way back as a browser would, holding its timer for the test to fire.
 *
 * @returns What the page can see, the timer, and what was loaded.
 */
const aTrial = () => {
  const script = /<script>([\s\S]*?)<\/script>/u.exec(withAWayBackToTheTvLayout(PAGE))?.[1] ?? '';
  const replace = vi.fn();
  const timers: { fire: () => void; isCleared: boolean } = {
    fire: () => undefined,
    isCleared: false,
  };
  const page: { valenceLayoutTrial?: Trial } = {};
  const browser = {
    window: page,
    location: { pathname: '/films', replace },
    document: { cookie: '' },
    setTimeout: (run: () => void) => {
      timers.fire = run;

      return 1;
    },
    clearTimeout: () => {
      timers.isCleared = true;
    },
    Date,
  };

  runInNewContext(script, browser);

  return { browser, timers, replace };
};

describe('withAWayBackToTheTvLayout', () => {
  it('puts the way back at the foot of the page, ahead of nothing the web app needs', () => {
    const page = withAWayBackToTheTvLayout(PAGE);

    expect(page.indexOf('<script>')).toBeGreaterThan(page.indexOf('<div id="root">'));
    expect(page.endsWith('</body></html>')).toBe(true);
  });

  it('goes back to the TV layout once its time is up, asking for it by address', () => {
    const { browser, timers, replace } = aTrial();

    timers.fire();

    expect(browser.document.cookie).toContain('valence-layout=tv');
    expect(replace).toHaveBeenCalledWith('/films?layout=tv');
  });

  it('stays, and remembers so, once the web app is told to keep it', () => {
    const { browser, timers, replace } = aTrial();

    browser.window.valenceLayoutTrial?.keep();

    expect(timers.isCleared).toBe(true);
    expect(browser.document.cookie).toContain('valence-layout-kept=1');
    expect(browser.window.valenceLayoutTrial).toBeUndefined();
    expect(replace).not.toHaveBeenCalled();
  });

  it('goes back at once when asked to', () => {
    const { browser, replace } = aTrial();

    browser.window.valenceLayoutTrial?.goBack();

    expect(replace).toHaveBeenCalledWith('/films?layout=tv');
  });
});
