import { describe, expect, it } from 'vitest';
import { makeAudioFrame } from './makeAudioFrame';

const SIZE = { width: 800, height: 600 };

const TIME = { seconds: 3, delta: 0.016 };

const silence = () => new Uint8Array(512);

const flat = () => new Uint8Array(1024).fill(128);

describe('makeAudioFrame', () => {
  it('carries the size, the time and the hue it was given', () => {
    const frame = makeAudioFrame(silence(), flat(), SIZE, TIME, 200);

    expect(frame).toMatchObject({ width: 800, height: 600, seconds: 3, delta: 0.016, hue: 200 });
  });

  it('hears nothing in silence', () => {
    const frame = makeAudioFrame(silence(), flat(), SIZE, TIME, 0);

    expect(frame.bass).toBe(0);
    expect(frame.mid).toBe(0);
    expect(frame.treble).toBe(0);
    expect(frame.spectrum(8)).toEqual(Array.from({ length: 8 }, () => 0));
  });

  it('tells bass from treble', () => {
    const heard = new Uint8Array(512);

    heard.fill(255, 0, 20);

    const frame = makeAudioFrame(heard, flat(), SIZE, TIME, 0);

    expect(frame.bass).toBeGreaterThan(0.5);
    expect(frame.treble).toBe(0);
  });

  it('folds the spectrum into as many bars as are asked for', () => {
    expect(makeAudioFrame(silence(), flat(), SIZE, TIME, 0).spectrum(48)).toHaveLength(48);
  });

  it('gives the wave from minus one to one around silence', () => {
    const wave = new Uint8Array(1024).fill(128);

    wave[0] = 255;
    wave[512] = 0;

    const points = makeAudioFrame(silence(), wave, SIZE, TIME, 0).wave(2);

    expect(points[0]).toBeCloseTo(0.9921875);
    expect(points[1]).toBe(-1);
  });

  it('gives a flat wave for a flat sound', () => {
    expect(makeAudioFrame(silence(), flat(), SIZE, TIME, 0).wave(4)).toEqual([0, 0, 0, 0]);
  });

  it('copes with a wave shorter than the points asked for', () => {
    expect(
      makeAudioFrame(silence(), new Uint8Array(2).fill(128), SIZE, TIME, 0).wave(8),
    ).toHaveLength(8);
  });
});
