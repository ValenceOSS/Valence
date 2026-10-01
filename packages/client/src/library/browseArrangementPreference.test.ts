import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import {
  DEFAULT_ARRANGEMENT,
  STORAGE_KEY,
  readBrowseArrangement,
  saveBrowseArrangement,
} from './browseArrangementPreference';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

afterEach(() => {
  forgetPlatform();
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
    const platform = aFakePlatform();

    platform.store.write(STORAGE_KEY, 'not json');
    installPlatform(platform);

    expect(readBrowseArrangement('films')).toEqual(DEFAULT_ARRANGEMENT);

    saveBrowseArrangement('films', { order: 'size', isHidingWatched: false });

    expect(readBrowseArrangement('films')).toEqual({ order: 'size', isHidingWatched: false });
  });

  it('reads an order it no longer knows as the newest first', () => {
    const platform = aFakePlatform();

    platform.store.write(
      STORAGE_KEY,
      JSON.stringify({ shows: { order: 'shuffled', isHidingWatched: true } }),
    );
    installPlatform(platform);

    expect(readBrowseArrangement('shows')).toEqual({ order: 'added', isHidingWatched: true });
  });
});
