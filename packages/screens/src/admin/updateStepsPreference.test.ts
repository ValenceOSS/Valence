import { afterEach, describe, expect, it } from 'vitest';
import { readUpdateStepsShown, saveUpdateStepsShown } from './updateStepsPreference';

afterEach(() => {
  window.localStorage.clear();
});

describe('updateStepsPreference', () => {
  it('keeps the steps folded until they have been opened', () => {
    expect(readUpdateStepsShown()).toBe(false);
  });

  it('remembers the steps being opened, and folded again', () => {
    saveUpdateStepsShown(true);
    expect(readUpdateStepsShown()).toBe(true);

    saveUpdateStepsShown(false);
    expect(readUpdateStepsShown()).toBe(false);
  });

  it('reads anything it does not understand as folded', () => {
    window.localStorage.setItem('valence.updateStepsShown', '"open"');

    expect(readUpdateStepsShown()).toBe(false);
  });
});
