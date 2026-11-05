import { afterEach, describe, expect, it } from 'vitest';
import { saveSavedViews } from './saveSavedViews';

afterEach(() => {
  window.localStorage.clear();
});

describe('saveSavedViews', () => {
  it('keeps the views on this device', () => {
    const view = {
      name: 'Edited',
      place: {
        library: null,
        search: '',
        show: 'edited' as const,
        sort: 'title' as const,
        isDescending: false,
        filters: [],
      },
    };

    saveSavedViews([view]);

    expect(JSON.parse(window.localStorage.getItem('valence.mediaSavedViews') ?? '[]')).toEqual([
      view,
    ]);
  });
});
