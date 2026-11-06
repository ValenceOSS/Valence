import { afterEach, describe, expect, it } from 'vitest';
import { readHiddenColumns } from './readHiddenColumns';
import { saveHiddenColumns } from './saveHiddenColumns';

afterEach(() => {
  window.localStorage.clear();
});

describe('readHiddenColumns', () => {
  it('reads back the columns hidden on this device', () => {
    saveHiddenColumns(['audio', 'length']);

    expect(readHiddenColumns()).toEqual(['audio', 'length']);
  });

  it('hides nothing where nothing was kept, or what was kept cannot be read', () => {
    expect(readHiddenColumns()).toEqual([]);

    window.localStorage.setItem('valence.mediaHiddenColumns', '{');

    expect(readHiddenColumns()).toEqual([]);
  });
});
