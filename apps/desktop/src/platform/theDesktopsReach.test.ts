import { afterEach, describe, expect, it, vi } from 'vitest';
import { theDesktopsReach } from './theDesktopsReach';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('theDesktopsReach', () => {
  it('says whether the server answers, and follows it, as the host does', () => {
    const stop = vi.fn();
    const whenChanged = vi.fn(() => stop);
    const listener = vi.fn();

    vi.stubGlobal('valence', { reach: { now: () => false, whenChanged } });

    const reach = theDesktopsReach();

    expect(reach.isReachable()).toBe(false);
    expect(reach.whenChanged(listener)).toBe(stop);
    expect(whenChanged).toHaveBeenCalledWith(listener);
  });
});
