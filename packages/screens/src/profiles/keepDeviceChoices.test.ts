import { afterEach, describe, expect, it } from 'vitest';
import { keepDeviceChoices } from './keepDeviceChoices';
import { readDeviceChoices } from './readDeviceChoices';

afterEach(() => {
  window.localStorage.clear();
});

describe('keepDeviceChoices', () => {
  it('keeps every choice on this device, to be read back as made', () => {
    const chosen = {
      theme: 'light',
      motion: 'full',
      pluginTheme: 'midnight/deep-sea',
      playsInTheBrowser: true,
      connections: 4,
      streamingFormat: 'dash',
      showsDesktopNotices: true,
    } as const;

    keepDeviceChoices(chosen);

    expect(readDeviceChoices()).toEqual(chosen);
  });
});
