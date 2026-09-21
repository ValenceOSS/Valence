import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  hasBeenTakenToSetup,
  hideSetupGuide,
  isSetupGuideHidden,
  markTakenToSetup,
} from '@ValenceScreens/components/AdminArea/setupGuidePreference';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('the setup guide preference', () => {
  it('shows the guide until it is put away, and then keeps it away', () => {
    expect(isSetupGuideHidden()).toBe(false);

    hideSetupGuide();

    expect(isSetupGuideHidden()).toBe(true);
  });

  it('takes a device to the libraries page once', () => {
    expect(hasBeenTakenToSetup()).toBe(false);

    markTakenToSetup();

    expect(hasBeenTakenToSetup()).toBe(true);
  });

  it('shows the guide, and does not redirect, where the device will not remember anything', () => {
    const blocked = () => {
      throw new Error('blocked');
    };

    vi.stubGlobal('localStorage', { getItem: blocked, setItem: blocked });

    expect(isSetupGuideHidden()).toBe(false);
    expect(hasBeenTakenToSetup()).toBe(true);
    expect(() => {
      hideSetupGuide();
      markTakenToSetup();
    }).not.toThrow();
  });
});
