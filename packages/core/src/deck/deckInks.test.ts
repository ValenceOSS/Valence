import { describe, expect, it } from 'vitest';
import { deckInks } from './deckInks';

describe('deckInks', () => {
  it('shades the cards behind only a little way from the ground, and inks the front one', () => {
    expect(deckInks('#ffffff', '#000000')).toEqual(['#242424', '#474747', '#ffffff']);
  });
});
