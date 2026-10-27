import { describe, expect, it } from 'vitest';
import { crossfadeChoices } from './crossfadeChoices';

describe('crossfadeChoices', () => {
  it('starts with off, explained as songs playing back to back', () => {
    expect(crossfadeChoices()[0]).toEqual({
      seconds: 0,
      label: 'Off',
      detail: 'Each song starts as the last one ends',
    });
  });

  it('offers a few seconds of overlap, up to twelve', () => {
    expect(crossfadeChoices().map((choice) => choice.seconds)).toEqual([0, 2, 4, 6, 8, 12]);
    expect(crossfadeChoices()[2]?.label).toBe('4 seconds');
  });
});
