import { afterEach, describe, expect, it } from 'vitest';
import {
  DEFAULT_WIDTH,
  STORAGE_KEY,
  readFileDetailsWidth,
  saveFileDetailsWidth,
} from './fileDetailsWidthPreference';

afterEach(() => {
  window.localStorage.clear();
});

describe('fileDetailsWidthPreference', () => {
  it('opens at the usual width when nothing is remembered', () => {
    expect(readFileDetailsWidth()).toBe(DEFAULT_WIDTH);
  });

  it('remembers the width it was left at', () => {
    saveFileDetailsWidth(440);

    expect(readFileDetailsWidth()).toBe(440);
  });

  it('ignores a remembered width it could not settle at', () => {
    window.localStorage.setItem(STORAGE_KEY, '9000');

    expect(readFileDetailsWidth()).toBe(DEFAULT_WIDTH);
  });
});
