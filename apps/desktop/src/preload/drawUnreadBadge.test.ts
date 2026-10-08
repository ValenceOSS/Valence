import { beforeAll, describe, expect, it, vi } from 'vitest';
import { drawUnreadBadge } from './drawUnreadBadge';
import type { UnreadBadgeCanvas } from './drawUnreadBadge';

/**
 * A canvas pen that remembers what it was asked to write.
 *
 * @returns The pen.
 */
const aPen = () => {
  const textAlign: CanvasTextAlign = 'start';
  const textBaseline: CanvasTextBaseline = 'alphabetic';
  const pen = {
    arc: vi.fn(),
    beginPath: vi.fn(),
    fill: vi.fn(),
    fillText: vi.fn(),
    measureText: vi.fn(() => ({ actualBoundingBoxAscent: 14, actualBoundingBoxDescent: 0 })),
    font: '',
    fillStyle: '',
    textAlign,
    textBaseline,
  };

  return pen;
};

/**
 * A canvas that draws with the given pen and always makes the same picture.
 *
 * @param pen - The pen, or null for a canvas that cannot draw.
 * @returns The canvas.
 */
const aCanvas = (pen: ReturnType<typeof aPen> | null): UnreadBadgeCanvas => ({
  width: 0,
  height: 0,
  getContext: () => pen,
  toDataURL: () => 'data:image/png;base64,AAAA',
});

beforeAll(() => {
  Object.defineProperty(document, 'fonts', {
    value: { load: () => Promise.resolve([]) },
    configurable: true,
  });
});

describe('drawUnreadBadge', () => {
  it('draws nothing when nothing is unread', async () => {
    await expect(drawUnreadBadge(0)).resolves.toBeNull();
  });

  it('writes the count centred by the height of its digits', async () => {
    const pen = aPen();

    await expect(drawUnreadBadge(4, aCanvas(pen))).resolves.toBe('data:image/png;base64,AAAA');
    expect(pen.fillText).toHaveBeenCalledWith('4', 16, 23);
  });

  it('writes counts past nine as 9+', async () => {
    const pen = aPen();

    await drawUnreadBadge(12, aCanvas(pen));

    expect(pen.fillText.mock.calls[0]?.[0]).toBe('9+');
  });

  it('gives up where the canvas cannot draw', async () => {
    await expect(drawUnreadBadge(4, aCanvas(null))).resolves.toBeNull();
  });
});
