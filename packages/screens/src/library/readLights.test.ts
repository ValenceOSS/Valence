import { afterEach, describe, expect, it, vi } from 'vitest';
import { readLights, READ_AT, ZONES } from './readLights';

/**
 * A canvas holding a picture divided into quarters, red, green, blue and white, that answers for
 * any part of it pixel by pixel, as a canvas does.
 */
const painted = () => {
  const colourAt = (x: number, y: number) =>
    x < READ_AT / 2 && y < READ_AT / 2
      ? [220, 30, 30]
      : x >= READ_AT / 2 && y < READ_AT / 2
        ? [30, 200, 30]
        : x < READ_AT / 2
          ? [30, 30, 220]
          : [240, 240, 240];

  const patch = (left: number, top: number, width: number, height: number) => {
    const data = new Uint8ClampedArray(width * height * 4);

    for (let row = 0; row < height; row += 1) {
      for (let column = 0; column < width; column += 1) {
        const colour = colourAt(left + column, top + row);
        const at = (row * width + column) * 4;

        data[at] = colour[0] ?? 0;
        data[at + 1] = colour[1] ?? 0;
        data[at + 2] = colour[2] ?? 0;
        data[at + 3] = 255;
      }
    }

    return { data, width, height, colorSpace: 'srgb' as const };
  };

  return {
    drawImage: vi.fn(),
    getImageData: vi.fn((left: number, top: number, width: number, height: number) =>
      patch(left, top, width, height),
    ),
  };
};

/**
 * Defined rather than spied on: jsdom draws nothing, so there is no context on it to replace.
 */
const withCanvas = (answer: () => ReturnType<typeof painted> | null) => {
  Object.defineProperty(HTMLCanvasElement.prototype, 'getContext', {
    configurable: true,
    value: answer,
  });
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('readLights', () => {
  it('reads the picture as a grid six across and four down, each light where its cell is', () => {
    expect(ZONES).toHaveLength(24);
    expect(ZONES[0]?.from).toEqual([0, 0, 1 / 6, 0.25]);
    expect(ZONES[23]?.from).toEqual([5 / 6, 0.75, 1 / 6, 0.25]);
    expect(new Set(ZONES.map((zone) => zone.at)).size).toBe(24);
  });

  it('answers with one light per part of the picture', () => {
    withCanvas(() => painted());

    expect(readLights(document.createElement('img'))).toHaveLength(ZONES.length);
  });

  it('takes each light from the part of the picture it belongs to', () => {
    withCanvas(() => painted());

    const lights = readLights(document.createElement('img'));

    expect(lights[0]?.at).toBe(ZONES[0]?.at);
    expect(lights[1]?.at).toBe(ZONES[1]?.at);
  });

  it('reads every corner of the picture in its own colour', () => {
    withCanvas(() => painted());

    const lights = readLights(document.createElement('img'));
    const hue = (at: number) => {
      const [red = 0, green = 0, blue = 0] = (lights[at]?.color.match(/\d+/g) ?? []).map(Number);

      return red > 200 && green > 200 && blue > 200
        ? 'white'
        : red > green && red > blue
          ? 'red'
          : green > blue
            ? 'green'
            : 'blue';
    };

    expect([hue(0), hue(5), hue(18), hue(23)]).toEqual(['red', 'green', 'blue', 'white']);
  });

  it('reads the picture back once, however many parts it is cut into', () => {
    const canvas = painted();

    withCanvas(() => canvas);
    readLights(document.createElement('img'));

    expect(canvas.getImageData).toHaveBeenCalledOnce();
  });

  it('says a red corner is red rather than grey', () => {
    withCanvas(() => painted());

    const [first] = readLights(document.createElement('img'));
    const read = /rgb\((\d+) (\d+) (\d+)\)/.exec(first?.color ?? '');

    expect(read).not.toBeNull();
    expect(Number(read?.[1])).toBeGreaterThan(Number(read?.[2]));
    expect(Number(read?.[1])).toBeGreaterThan(Number(read?.[3]));
  });

  it('lets a vivid colour shine and keeps white from lighting the page', () => {
    withCanvas(() => painted());

    const lights = readLights(document.createElement('img'));

    expect(lights[0]?.weight).toBe(1);
    expect(lights[23]?.weight).toBe(0);
  });

  it('reads at a size a page can afford', () => {
    const context = painted();

    withCanvas(() => context);
    readLights(document.createElement('img'));

    expect(context.drawImage).toHaveBeenCalledWith(expect.anything(), 0, 0, READ_AT, READ_AT);
  });

  it('answers with nothing rather than throwing when the frame cannot be read', () => {
    withCanvas(() => {
      throw new Error('tainted by a picture from somewhere else');
    });

    expect(readLights(document.createElement('img'))).toEqual([]);
  });

  it('answers with nothing where there is no canvas to read with', () => {
    withCanvas(() => null);

    expect(readLights(document.createElement('img'))).toEqual([]);
  });
});
