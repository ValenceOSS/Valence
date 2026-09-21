import type { Painter } from '@ValenceScreens/music/visualisers/Painter';

type Marks = 'fillRect' | 'moveTo' | 'lineTo' | 'arc' | 'stroke' | 'fill';

/**
 * A painter that keeps what it was asked to draw, so a test can say something was drawn, and that
 * nothing was drawn at a place that is not a number.
 *
 * @returns The painter, every number it was given, and how many of each mark it was asked for.
 */
const aFakePainter = (): {
  painter: Painter;
  numbers: number[];
  counts: Record<Marks, number>;
} => {
  const numbers: number[] = [];
  const counts: Record<Marks, number> = {
    fillRect: 0,
    moveTo: 0,
    lineTo: 0,
    arc: 0,
    stroke: 0,
    fill: 0,
  };

  const marking =
    (mark: Marks) =>
    (...values: number[]): void => {
      counts[mark] += 1;
      numbers.push(...values);
    };

  const nothing = (): void => undefined;

  const painter: Painter = {
    fillStyle: '',
    strokeStyle: '',
    lineWidth: 1,
    lineCap: 'butt',
    lineJoin: 'miter',
    globalAlpha: 1,
    globalCompositeOperation: 'source-over',
    shadowBlur: 0,
    shadowColor: '',
    fillRect: marking('fillRect'),
    moveTo: marking('moveTo'),
    lineTo: marking('lineTo'),
    arc: marking('arc'),
    stroke: marking('stroke'),
    fill: marking('fill'),
    beginPath: nothing,
    closePath: nothing,
    save: nothing,
    restore: nothing,
    translate: (x, y) => {
      numbers.push(x, y);
    },
    rotate: (angle) => {
      numbers.push(angle);
    },
  };

  return { painter, numbers, counts };
};

export { aFakePainter };
