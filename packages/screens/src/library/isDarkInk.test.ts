import { afterEach, describe, expect, it, vi } from 'vitest';
import { isDarkInk } from './isDarkInk';

/**
 * Hands every canvas a context that reads back the one colour given, everywhere.
 */
const aCanvasOf = (red: number, green: number, blue: number, alpha: number) => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    writable: true,
    value: () => ({
      drawImage: vi.fn(),
      getImageData: (_left: number, _top: number, width: number, height: number) => {
        const data = new Uint8ClampedArray(width * height * 4);

        for (let at = 0; at < data.length; at += 4) {
          data[at] = red;
          data[at + 1] = green;
          data[at + 2] = blue;
          data[at + 3] = alpha;
        }

        return { data, width, height, colorSpace: 'srgb' };
      },
    }),
  });
};

/**
 * Hands every canvas the context given, however it answers.
 */
const aCanvasAnswering = (answer: () => object | null) => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    writable: true,
    value: answer,
  });
};

afterEach(() => {
  aCanvasAnswering(() => null);
});

describe('isDarkInk', () => {
  it('says black lettering is dark', () => {
    aCanvasOf(12, 12, 16, 255);

    expect(isDarkInk(document.createElement('img'))).toBe(true);
  });

  it('says white lettering is not', () => {
    aCanvasOf(245, 245, 245, 255);

    expect(isDarkInk(document.createElement('img'))).toBe(false);
  });

  it('leaves bright colour alone, since it reads over a picture as it is', () => {
    aCanvasOf(250, 200, 20, 255);

    expect(isDarkInk(document.createElement('img'))).toBe(false);
  });

  it('reads a saturated red logo as light, since it stands out against black by colour rather than luminance', () => {
    aCanvasOf(214, 21, 40, 255);

    expect(isDarkInk(document.createElement('img'))).toBe(false);
  });

  it('still reads navy lettering as dark, since a dark colour has no bright channel to save it', () => {
    aCanvasOf(20, 24, 60, 255);

    expect(isDarkInk(document.createElement('img'))).toBe(true);
  });

  it('counts only what is drawn, so a transparent ground says nothing either way', () => {
    aCanvasOf(0, 0, 0, 0);

    expect(isDarkInk(document.createElement('img'))).toBe(false);
  });

  it('says no where there is nothing to read the image with', () => {
    aCanvasAnswering(() => null);

    expect(isDarkInk(document.createElement('img'))).toBe(false);
  });

  it('says no where the image refuses to be read, rather than guessing', () => {
    aCanvasAnswering(() => ({
      drawImage: vi.fn(),
      getImageData: () => {
        throw new Error('The canvas has been tainted by cross-origin data.');
      },
    }));

    expect(isDarkInk(document.createElement('img'))).toBe(false);
  });
});
