import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  hasBeenTakenToSetup,
  hideSetupGuide,
  isSetupGuideHidden,
  markTakenToSetup,
} from '@ValenceScreens/components/AdminArea/setupGuidePreference';

afterEach(() => {
  window.localStorage.clear();
  vi.restoreAllMocks();
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
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked');
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked');
    });

    expect(isSetupGuideHidden()).toBe(false);
    expect(hasBeenTakenToSetup()).toBe(true);
    expect(() => {
      hideSetupGuide();
      markTakenToSetup();
    }).not.toThrow();
  });
});
