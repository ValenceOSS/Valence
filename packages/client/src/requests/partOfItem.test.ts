import { describe, expect, it } from 'vitest';
import { partOfItem } from './partOfItem';

describe('partOfItem', () => {
  it('says where each state stands', () => {
    const at = (state: Parameters<typeof partOfItem>[0]['state']) =>
      partOfItem({ state, isFollowed: true, lastSearchedAt: null }, 'approved');

    expect(at('available')).toBe('library');
    expect(at('filed')).toBe('library');
    expect(at('downloading')).toBe('downloading');
    expect(at('chosen')).toBe('downloading');
    expect(at('filing')).toBe('downloading');
    expect(at('failed')).toBe('failed');
    expect(at('wanted')).toBe('queued');
    expect(at('searching')).toBe('searching');
    expect(at('waiting')).toBe('waiting');
  });

  it('says nothing was found only once it has been searched for', () => {
    expect(
      partOfItem(
        { state: 'wanted', isFollowed: true, lastSearchedAt: '2026-11-05T12:00:00.000Z' },
        'approved',
      ),
    ).toBe('missing');
  });

  it('waits on approval, and follows nothing unfollowed, for what is not yet here', () => {
    expect(
      partOfItem({ state: 'wanted', isFollowed: true, lastSearchedAt: null }, 'awaiting'),
    ).toBe('toApprove');
    expect(
      partOfItem({ state: 'wanted', isFollowed: false, lastSearchedAt: null }, 'approved'),
    ).toBe('notFollowed');
    expect(
      partOfItem({ state: 'available', isFollowed: false, lastSearchedAt: null }, 'awaiting'),
    ).toBe('library');
  });
});
