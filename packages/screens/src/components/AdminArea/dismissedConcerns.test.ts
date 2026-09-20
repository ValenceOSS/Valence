import { afterEach, describe, expect, it } from 'vitest';
import { readDismissedConcerns, saveDismissedConcerns } from './dismissedConcerns';

afterEach(() => {
  window.localStorage.clear();
});

describe('dismissedConcerns', () => {
  it('remembers what was dismissed on this device', () => {
    saveDismissedConcerns(['disk:The library disk is nearly full']);

    expect(readDismissedConcerns()).toEqual(['disk:The library disk is nearly full']);
  });

  it('reads nothing where nothing, or something else, was kept', () => {
    expect(readDismissedConcerns()).toEqual([]);

    window.localStorage.setItem('valence.dismissedConcerns', '{"not":"a list"}');

    expect(readDismissedConcerns()).toEqual([]);

    window.localStorage.setItem('valence.dismissedConcerns', 'not json');

    expect(readDismissedConcerns()).toEqual([]);
  });
});
