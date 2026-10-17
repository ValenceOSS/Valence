import { afterEach, describe, expect, it } from 'vitest';
import { readPinnedPanels, savePinnedPanels, STORAGE_KEY } from './pinnedPanelsPreference';

afterEach(() => {
  window.localStorage.clear();
});

describe('pinnedPanelsPreference', () => {
  it('pins nothing at first', () => {
    expect(readPinnedPanels()).toEqual([]);
  });

  it('remembers the pages pinned, in order', () => {
    savePinnedPanels(['downloads', 'activity']);

    expect(readPinnedPanels()).toEqual(['downloads', 'activity']);
  });

  it('ignores something it cannot read', () => {
    window.localStorage.setItem(STORAGE_KEY, '{nonsense');

    expect(readPinnedPanels()).toEqual([]);
  });
});
