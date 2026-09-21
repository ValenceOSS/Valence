import { afterEach, describe, expect, it, vi } from 'vitest';
import { VISUALISERS } from '@ValenceScreens/music/visualisers/VISUALISERS';
import { readVisualiserChoice, saveVisualiserChoice } from './visualiserPreference';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('visualiserPreference', () => {
  it('starts on the first visualiser', () => {
    expect(readVisualiserChoice()).toBe(0);
  });

  it('brings back the one that was chosen', () => {
    saveVisualiserChoice(3);

    expect(readVisualiserChoice()).toBe(3);
    expect(window.localStorage.getItem('valence.visualiser')).toBe(VISUALISERS[3]?.id);
  });

  it('falls back to the first when the one chosen is gone', () => {
    window.localStorage.setItem('valence.visualiser', 'removed');

    expect(readVisualiserChoice()).toBe(0);
  });

  it('ignores a place that is not in the list', () => {
    saveVisualiserChoice(99);

    expect(window.localStorage.getItem('valence.visualiser')).toBeNull();
  });

  it('carries on where storage will not answer', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(readVisualiserChoice()).toBe(0);
    expect(() => {
      saveVisualiserChoice(1);
    }).not.toThrow();
  });
});
