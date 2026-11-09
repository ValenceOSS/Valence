import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSessionLayout, saveSessionLayout } from './sessionLayoutPreference';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('sessionLayoutPreference', () => {
  it('shows the sessions as a table for somebody who never chose', () => {
    expect(readSessionLayout()).toBe('table');
  });

  it('remembers the layout somebody chose', () => {
    saveSessionLayout('cards');

    expect(readSessionLayout()).toBe('cards');
  });

  it('carries on where the browser refuses to keep anything', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(readSessionLayout()).toBe('table');
  });
});
