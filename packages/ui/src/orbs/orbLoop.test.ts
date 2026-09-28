import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { orbLoop } from './orbLoop';
import type { OrbLook } from './OrbLook';
import type { OrbVariant } from './OrbVariant';

const stop = vi.fn();

vi.mock('@ValenceUI/orbs/showOrb', () => ({
  showOrb: (
    target: HTMLCanvasElement,
    _variant: OrbVariant,
    _look: () => OrbLook,
    how: { across: number },
  ) => {
    target.width = how.across;
    target.height = how.across;

    return { stop, redraw: vi.fn() };
  },
}));

const VARIANT: OrbVariant = { key: 'glow', label: 'Glow', shader: '', params: [], colours: [] };

const LOOK = { params: {}, colours: {} };

beforeEach(() => {
  stop.mockReset();
  let now = 0;

  vi.stubGlobal('requestAnimationFrame', (next: (at: number) => void) => {
    now += 100;
    queueMicrotask(() => {
      next(now);
    });

    return 1;
  });
});

const original = Object.getOwnPropertyDescriptor(HTMLCanvasElement.prototype, 'getContext');

const paintWith = (paint: object | null) => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: () => paint,
  });
};

afterEach(() => {
  vi.unstubAllGlobals();

  if (original !== undefined) {
    Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', original);
  }
});

describe('orbLoop', () => {
  it('films the orb and hands back a looping GIF, then stops showing it', async () => {
    paintWith({
      getImageData: (_x: number, _y: number, across: number) => ({
        data: new Uint8ClampedArray(across * across * 4).fill(200),
      }),
    });

    const gif = await orbLoop(VARIANT, LOOK, 4);

    expect(gif?.type).toBe('image/gif');
    expect(gif?.size).toBeGreaterThan(0);
    expect(stop).toHaveBeenCalled();
  });

  it('hands back nothing where the browser cannot draw it', async () => {
    paintWith(null);

    await expect(orbLoop(VARIANT, LOOK, 4)).resolves.toBeNull();
    expect(stop).toHaveBeenCalled();
  });
});
