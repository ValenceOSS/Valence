import { afterEach, describe, expect, it, vi } from 'vitest';
import { carryTheStorageOver } from './carryTheStorageOver';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('carryTheStorageOver', () => {
  it("writes what the Electron app's page kept into this page's storage", () => {
    const isCarried = carryTheStorageOver(
      { 'valence.playback': '{"volume":0.4}', 'valence.gridSize': 'large' },
      () => window.localStorage,
    );

    expect(isCarried).toBe(true);
    expect(window.localStorage.getItem('valence.playback')).toBe('{"volume":0.4}');
    expect(window.localStorage.getItem('valence.gridSize')).toBe('large');
  });

  it('leaves alone what this page has kept since', () => {
    window.localStorage.setItem('valence.gridSize', 'small');

    expect(carryTheStorageOver({ 'valence.gridSize': 'large' }, () => window.localStorage)).toBe(
      true,
    );
    expect(window.localStorage.getItem('valence.gridSize')).toBe('small');
  });

  it('says there was nothing to carry where there was nothing', () => {
    expect(carryTheStorageOver({}, () => window.localStorage)).toBe(false);
  });

  it('says it is not done where the storage cannot be reached', () => {
    expect(
      carryTheStorageOver({ a: 'b' }, () => {
        throw new DOMException('denied', 'SecurityError');
      }),
    ).toBe(false);
  });

  it('writes what it can and says it is not done where one entry will not fit', () => {
    const setItem = vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key: string) => {
      if (key === 'big') {
        throw new DOMException('full', 'QuotaExceededError');
      }
    });

    expect(carryTheStorageOver({ big: 'x', small: 'y' }, () => window.localStorage)).toBe(false);
    expect(setItem).toHaveBeenCalledWith('small', 'y');
  });
});
