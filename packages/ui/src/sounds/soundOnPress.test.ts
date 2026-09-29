import { describe, expect, it } from 'vitest';
import { soundOnPress } from './soundOnPress';

describe('soundOnPress', () => {
  it('marks a control with the sound it makes', () => {
    expect(soundOnPress('toggle')).toEqual({ 'data-cuelume-toggle': '' });
    expect(soundOnPress('type')).toEqual({ 'data-cuelume-type': '' });
  });

  it('marks nothing on a control that stays quiet', () => {
    expect(soundOnPress('none')).toEqual({});
  });
});
