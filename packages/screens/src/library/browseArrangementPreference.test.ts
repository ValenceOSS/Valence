import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_ARRANGEMENT,
  readBrowseArrangement,
  saveBrowseArrangement,
} from './browseArrangementPreference';

afterEach(() => {
  window.localStorage.clear();
});

describe('browseArrangementPreference', () => {
  it('shows the newest first, and everything, until somebody chooses otherwise', () => {
    expect(readBrowseArrangement('films')).toEqual(DEFAULT_ARRANGEMENT);
  });

  it('remembers each page on its own', () => {
    saveBrowseArrangement('films', { order: 'released', isHidingWatched: true });
    saveBrowseArrangement('shows', { order: 'title', isHidingWatched: false });

    expect(readBrowseArrangement('films')).toEqual({ order: 'released', isHidingWatched: true });
    expect(readBrowseArrangement('shows')).toEqual({ order: 'title', isHidingWatched: false });
  });

  it('falls back to the default rather than failing on something it cannot read', () => {
    window.localStorage.setItem('valence.browseArrangement', 'not json');

    expect(readBrowseArrangement('films')).toEqual(DEFAULT_ARRANGEMENT);
  });
});
