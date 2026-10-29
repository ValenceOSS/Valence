import { describe, expect, it } from 'vitest';
import { createPlaybackTally } from './createPlaybackTally';

describe('createPlaybackTally', () => {
  it('counts each player once, by the kind of app it is', () => {
    const tally = createPlaybackTally();

    tally.note('browser', 'one');
    tally.note('browser', 'one');
    tally.note('browser', 'two');
    tally.note('tv', 'lounge');

    expect(tally.read()).toEqual({ browser: 2, desktop: 0, tv: 1, phone: 0 });
  });

  it('starts again once cleared', () => {
    const tally = createPlaybackTally();

    tally.note('phone', 'pocket');
    tally.clear();

    expect(tally.read()).toEqual({ browser: 0, desktop: 0, tv: 0, phone: 0 });
  });
});
