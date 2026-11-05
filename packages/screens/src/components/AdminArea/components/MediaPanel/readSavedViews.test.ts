import { afterEach, describe, expect, it } from 'vitest';
import { readSavedViews } from './readSavedViews';
import { saveSavedViews } from './saveSavedViews';

const VIEW = {
  name: 'Missing posters',
  place: {
    library: 'lib',
    search: '',
    show: 'all' as const,
    sort: 'added' as const,
    isDescending: true,
    filters: ['missing:poster'],
  },
};

afterEach(() => {
  window.localStorage.clear();
});

describe('readSavedViews', () => {
  it('reads back the views saved on this device', () => {
    saveSavedViews([VIEW]);

    expect(readSavedViews()).toEqual([VIEW]);
  });

  it('reads none where nothing, or nothing readable, was saved', () => {
    expect(readSavedViews()).toEqual([]);

    window.localStorage.setItem('valence.mediaSavedViews', '{not json');

    expect(readSavedViews()).toEqual([]);
  });
});
