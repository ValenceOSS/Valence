import { guideRules } from '@ValenceTv/focus/guideRules';
import { moveFocus } from '@ValenceTv/focus/moveFocus';
import { nextFocusOverrides } from '@ValenceTv/focus/nextFocusOverrides';
import { aLandingPlace } from '@ValenceTv/testing/aLandingPlace';
import { placeOnScreen } from '@ValenceTv/testing/placeOnScreen';

const box = (left: number, top: number, width = 100, height = 100) => ({
  left,
  top,
  right: left + width,
  bottom: top + height,
});

/**
 * A part of the page to put places in, drawn across the whole screen.
 *
 * @returns The part.
 */
const aPart = (): HTMLElement => {
  const part = document.createElement('div');

  placeOnScreen(part, box(0, 0, 1920, 1080));
  document.body.append(part);

  return part;
};

const named = (): string | null => document.activeElement?.getAttribute('aria-label') ?? null;

describe('moveFocus', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    Element.prototype.scrollIntoView = jest.fn();
  });

  it('moves along a row to the next place that way', () => {
    const row = aPart();

    aLandingPlace(row, 'first', box(0, 500)).focus();
    aLandingPlace(row, 'second', box(120, 500));

    expect(moveFocus('right')).toBe(true);
    expect(named()).toBe('second');
  });

  it('lands on the first place when nothing has the remote', () => {
    aLandingPlace(aPart(), 'only', box(0, 0));

    expect(moveFocus('down')).toBe(true);
    expect(named()).toBe('only');
  });

  it('stays where it is with nothing that way', () => {
    aLandingPlace(aPart(), 'only', box(0, 0)).focus();

    expect(moveFocus('left')).toBe(false);
    expect(named()).toBe('only');
  });

  it('keeps the remote inside a panel that traps it that way', () => {
    const page = aPart();
    const panel = document.createElement('div');

    placeOnScreen(panel, box(0, 400, 1920, 600));
    page.append(panel);
    guideRules.set(panel, {
      isRemembering: false,
      trapped: new Set(['up']),
      isShut: false,
      lastFocused: null,
    });
    aLandingPlace(page, 'above', box(0, 0));
    aLandingPlace(panel, 'inside', box(0, 500)).focus();

    expect(moveFocus('up')).toBe(false);
    expect(named()).toBe('inside');
  });

  it('comes back into a remembering guide where the remote last was', () => {
    const page = aPart();
    const row = document.createElement('div');

    placeOnScreen(row, box(0, 500, 1920, 100));
    page.append(row);
    aLandingPlace(page, 'above', box(0, 0)).focus();
    aLandingPlace(row, 'near', box(0, 500));

    const last = aLandingPlace(row, 'last', box(500, 500));

    guideRules.set(row, {
      isRemembering: true,
      trapped: new Set(),
      isShut: false,
      lastFocused: last,
    });

    expect(moveFocus('down')).toBe(true);
    expect(named()).toBe('last');
  });

  it('goes where a place says pressing that way should go', () => {
    const page = aPart();
    const from = aLandingPlace(page, 'from', box(0, 0));

    aLandingPlace(page, 'beside', box(120, 0));

    const told = aLandingPlace(page, 'told', box(900, 900));

    nextFocusOverrides.set(from, { right: told });
    from.focus();

    expect(moveFocus('right')).toBe(true);
    expect(named()).toBe('told');
  });
});
