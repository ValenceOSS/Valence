import { describe, expect, it } from 'vitest';
import { letterNudge } from './letterNudge';

const CAPITAL = {
  width: 0.6,
  inkLeft: 0,
  inkRight: 0.6,
  inkAscent: 0.7,
  inkDescent: 0,
  fontAscent: 0.9,
  fontDescent: 0.3,
  weightAcross: 0.3,
};

describe('letterNudge', () => {
  it('leaves alone a letter whose ink already sits in the middle of its line', () => {
    const nudge = letterNudge({ ...CAPITAL, fontAscent: 0.7, fontDescent: 0 });

    expect(nudge.x).toBeCloseTo(0);
    expect(nudge.y).toBeCloseTo(0);
  });

  it('brings a capital down to the middle where the font sets it high in its line', () => {
    expect(letterNudge(CAPITAL).y).toBeCloseTo(0.05);
  });

  it('moves a letter across halfway between its ink’s middle and where its ink weighs', () => {
    expect(letterNudge({ ...CAPITAL, weightAcross: 0.2 }).x).toBeCloseTo(0.05);
  });

  it('brings a slanted letter whose ink runs past its advance back to the middle', () => {
    expect(letterNudge({ ...CAPITAL, inkRight: 0.8, weightAcross: 0.4 }).x).toBeCloseTo(-0.1);
  });
});
