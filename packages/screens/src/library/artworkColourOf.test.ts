import { describe, expect, it } from 'vitest';
import { artworkColourOf } from './artworkColourOf';

describe('artworkColourOf', () => {
  it('gives the same thing the same colour every time', () => {
    expect(artworkColourOf('Harbour Lights')).toBe(artworkColourOf('Harbour Lights'));
  });

  it('picks one of the six artwork colours', () => {
    const picked = ['a', 'Ember', 'Northbound', 'mix-1', 'mix-2', 'x'.repeat(40)].map(
      artworkColourOf,
    );

    for (const colour of picked) {
      expect(colour).toMatch(/^var\(--mix-colour-[1-6]\)$/u);
    }
  });

  it('spreads different things across more than one colour', () => {
    const picked = new Set(
      ['Ember', 'Harbour Lights', 'Northbound', 'Low Tide', 'Second Light'].map(artworkColourOf),
    );

    expect(picked.size).toBeGreaterThan(1);
  });
});
