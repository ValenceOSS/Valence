import { describe, expect, it } from 'vitest';
import { partOfItem } from './partOfItem';

describe('partOfItem', () => {
  it('says where each state stands', () => {
    const at = (state: Parameters<typeof partOfItem>[0]['state']) =>
      partOfItem({ state, isFollowed: true }, 'approved');

    expect(at('available')).toBe('library');
    expect(at('filed')).toBe('library');
    expect(at('downloading')).toBe('downloading');
    expect(at('chosen')).toBe('downloading');
    expect(at('filing')).toBe('downloading');
    expect(at('failed')).toBe('failed');
    expect(at('wanted')).toBe('missing');
    expect(at('searching')).toBe('missing');
    expect(at('waiting')).toBe('waiting');
  });

  it('waits on approval, and follows nothing unfollowed, for what is not yet here', () => {
    expect(partOfItem({ state: 'wanted', isFollowed: true }, 'awaiting')).toBe('toApprove');
    expect(partOfItem({ state: 'wanted', isFollowed: false }, 'approved')).toBe('notFollowed');
    expect(partOfItem({ state: 'available', isFollowed: false }, 'awaiting')).toBe('library');
  });
});
