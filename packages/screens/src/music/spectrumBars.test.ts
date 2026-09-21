import { describe, expect, it } from 'vitest';
import { spectrumBars } from '@ValenceScreens/music/spectrumBars';

describe('spectrumBars', () => {
  it('makes as many bars as it is asked for', () => {
    expect(spectrumBars(new Uint8Array(128), 24)).toHaveLength(24);
  });

  it('draws silence as bars of nothing', () => {
    expect(spectrumBars(new Uint8Array(128), 8).every((bar) => bar === 0)).toBe(true);
  });

  it('draws the loudest sound as a full bar', () => {
    expect(spectrumBars(new Uint8Array(128).fill(255), 4)).toEqual([1, 1, 1, 1]);
  });

  it('pulls a quiet sound down further than a loud one', () => {
    const [quiet] = spectrumBars(new Uint8Array(64).fill(64), 1);
    const [loud] = spectrumBars(new Uint8Array(64).fill(192), 1);

    expect(quiet).toBeLessThan(64 / 255);
    expect(loud).toBeGreaterThan(quiet ?? 1);
  });

  it('ignores the very top of the range, where music has nothing', () => {
    const heard = new Uint8Array(100);

    heard.fill(255, 80);

    expect(spectrumBars(heard, 5).every((bar) => bar === 0)).toBe(true);
  });

  it('still makes bars from fewer frequencies than there are bars', () => {
    expect(spectrumBars(new Uint8Array(4).fill(255), 16)).toHaveLength(16);
  });
});
