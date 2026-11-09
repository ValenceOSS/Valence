import { afterEach, describe, expect, it, vi } from 'vitest';
import { DEFAULT_GRID_SIZE, STORAGE_KEY, readGridSize, saveGridSize } from './gridSizePreference';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('readGridSize', () => {
  it('starts at the middle size, which suits a page nobody has an opinion about yet', () => {
    expect(readGridSize()).toBe(DEFAULT_GRID_SIZE);
  });

  it('remembers what was chosen last', () => {
    saveGridSize('large');

    expect(readGridSize()).toBe('large');
  });

  it('ignores a size that means nothing rather than laying the page out with it', () => {
    window.localStorage.setItem(STORAGE_KEY, 'enormous');

    expect(readGridSize()).toBe(DEFAULT_GRID_SIZE);
  });

  it('keeps a choice made under another key apart from the library’s', () => {
    saveGridSize('small', 'valence.sessionCardSize');
    saveGridSize('large');

    expect(readGridSize('valence.sessionCardSize')).toBe('small');
    expect(readGridSize()).toBe('large');
  });

  it('starts another key at the middle size, whatever the library has chosen', () => {
    saveGridSize('large');

    expect(readGridSize('valence.sessionCardSize')).toBe(DEFAULT_GRID_SIZE);
  });

  it('still draws the page when the browser refuses to be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('Storage is disabled.');
    });

    expect(readGridSize()).toBe(DEFAULT_GRID_SIZE);
  });
});

describe('saveGridSize', () => {
  it('writes the choice where the next visit will find it', () => {
    saveGridSize('small');

    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('small');
  });

  it('writes a choice under the key it is given, leaving the library’s alone', () => {
    saveGridSize('small', 'valence.sessionCardSize');

    expect(window.localStorage.getItem('valence.sessionCardSize')).toBe('small');
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });

  it('says nothing when the browser refuses to be written to', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('Storage is full.');
    });

    expect(() => {
      saveGridSize('large');
    }).not.toThrow();
  });
});
