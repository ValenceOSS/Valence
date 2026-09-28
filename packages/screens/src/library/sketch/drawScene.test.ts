import { describe, expect, it, vi } from 'vitest';
import { drawScene } from './drawScene';
import type { SketchScene } from '@ValenceContracts/schemas/SketchScene';

/**
 * A stand-in for a canvas's 2D context that records what was drawn and what it was set to.
 */
const aPaint = () => {
  const calls: string[] = [];
  const record =
    (name: string) =>
    (...args: (number | string)[]) => {
      calls.push(`${name}(${args.join(',')})`);
    };
  const paint = {
    save: record('save'),
    restore: record('restore'),
    setTransform: record('setTransform'),
    clearRect: record('clearRect'),
    scale: record('scale'),
    fillRect: record('fillRect'),
    beginPath: record('beginPath'),
    arc: record('arc'),
    fill: record('fill'),
    moveTo: record('moveTo'),
    lineTo: record('lineTo'),
    stroke: record('stroke'),
    translate: record('translate'),
    rotate: record('rotate'),
    fillText: vi.fn(record('fillText')),
    globalAlpha: 1,
    strokeStyle: '',
    fillStyle: '',
    lineCap: 'butt',
    lineJoin: 'miter',
    lineWidth: 1,
    textAlign: 'start',
    textBaseline: 'alphabetic',
    font: '',
  };

  return { paint, calls };
};

/**
 * Stands the recording stand-in in for a real context, since it answers everything a scene draws with.
 *
 * @param fake - The stand-in.
 * @returns Whether it will do.
 */
const drawsLikeACanvas = (fake: object): fake is CanvasRenderingContext2D =>
  'fillRect' in fake && 'fillText' in fake && 'stroke' in fake;

const draw = (scene: SketchScene, across = 500) => {
  const { paint, calls } = aPaint();

  if (!drawsLikeACanvas(paint)) {
    throw new Error('The stand-in cannot be drawn on.');
  }

  drawScene(paint, scene, across);

  return { paint, calls };
};

describe('drawScene', () => {
  it('clears the canvas and lays the background over the whole square, scaled to the canvas', () => {
    const { calls } = draw({ background: '#112233', items: [] }, 500);

    expect(calls).toEqual([
      'save()',
      'setTransform(1,0,0,1,0,0)',
      'clearRect(0,0,500,500)',
      'scale(0.5,0.5)',
      'fillRect(0,0,1000,1000)',
      'restore()',
    ]);
  });

  it('draws a single tap as a dot', () => {
    const { calls } = draw({
      background: '#000000',
      items: [
        { kind: 'stroke', tool: 'pen', colour: '#ffffff', size: 10, points: [[100, 100, 1]] },
      ],
    });

    expect(calls).toContain('fill()');
    expect(calls.some((call) => call.startsWith('arc(100,100,'))).toBe(true);
  });

  it('draws a marker as one line through every point', () => {
    const { calls } = draw({
      background: '#000000',
      items: [
        {
          kind: 'stroke',
          tool: 'marker',
          colour: '#ffffff',
          size: 10,
          points: [
            [0, 0, 1],
            [10, 10, 1],
            [20, 0, 1],
          ],
        },
      ],
    });

    expect(calls.filter((call) => call === 'stroke()')).toHaveLength(1);
    expect(calls).toContain('lineTo(20,0)');
  });

  it('draws a pen stretch by stretch, as heavy as it was pressed', () => {
    const { calls } = draw({
      background: '#000000',
      items: [
        {
          kind: 'stroke',
          tool: 'pen',
          colour: '#ffffff',
          size: 10,
          points: [
            [0, 0, 0.2],
            [10, 10, 1],
            [20, 0, 0.5],
          ],
        },
      ],
    });

    expect(calls.filter((call) => call === 'stroke()')).toHaveLength(2);
  });

  it('writes words and stickers where they were put, turned as they were turned', () => {
    const { calls } = draw({
      background: '#000000',
      items: [
        {
          kind: 'text',
          text: 'Hi',
          font: 'gilroy',
          colour: '#ffffff',
          x: 300,
          y: 400,
          size: 80,
          turn: 90,
        },
        { kind: 'sticker', sticker: '⭐️', x: 50, y: 60, size: 100, turn: 0 },
      ],
    });

    expect(calls).toContain('translate(300,400)');
    expect(calls).toContain('fillText(Hi,0,0)');
    expect(calls).toContain('translate(50,60)');
    expect(calls.some((call) => call.startsWith('fillText(⭐️,0,'))).toBe(true);
  });
});
