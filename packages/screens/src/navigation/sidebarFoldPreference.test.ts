import { afterEach, describe, expect, it, vi } from 'vitest';
import { readSidebarFolds, saveSidebarFolds } from './sidebarFoldPreference';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('sidebarFoldPreference', () => {
  it('remembers which groups were left open or folded, on this device', () => {
    saveSidebarFolds({ requests: true, system: false });

    expect(readSidebarFolds()).toEqual({ requests: true, system: false });
  });

  it('remembers nothing for a viewer who has never folded a group', () => {
    expect(readSidebarFolds()).toEqual({});
  });

  it('forgets what it holds where it is not what it saved', () => {
    window.localStorage.setItem('valence.sidebarFolds', '{"requests":"yes"}');

    expect(readSidebarFolds()).toEqual({});

    window.localStorage.setItem('valence.sidebarFolds', 'not json');

    expect(readSidebarFolds()).toEqual({});
  });

  it('carries on where the browser will not keep anything', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(() => {
      saveSidebarFolds({ requests: true });
    }).not.toThrow();
    expect(readSidebarFolds()).toEqual({});
  });
});
