import { describe, expect, it } from 'vitest';
import { levellingChoices } from './levellingChoices';

describe('levellingChoices', () => {
  it('offers off, each song and whole albums, in that order, each explained', () => {
    expect(levellingChoices()).toEqual([
      { id: 'off', label: 'Off', detail: 'Songs play as they were mastered' },
      { id: 'track', label: 'Each song', detail: 'Every song plays at one loudness' },
      { id: 'album', label: 'Whole albums', detail: 'Albums keep their quiet and loud songs' },
    ]);
  });
});
