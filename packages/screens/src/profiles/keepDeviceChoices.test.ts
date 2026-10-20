import { afterEach, describe, expect, it } from 'vitest';
import { chooseTheme } from '@ValenceClient/shell/theme';
import { keepDeviceChoices } from './keepDeviceChoices';
import { readDeviceChoices } from './readDeviceChoices';

afterEach(() => {
  window.localStorage.clear();
});

describe('keepDeviceChoices', () => {
  it('keeps every choice the editor changed, to be read back as made', () => {
    const was = readDeviceChoices();
    const chosen = {
      theme: 'light',
      motion: 'full',
      pluginTheme: 'midnight/deep-sea',
      playsInTheBrowser: true,
      connections: 4,
      streamingFormat: 'dash',
      showsDesktopNotices: true,
    } as const;

    keepDeviceChoices(chosen, was);

    expect(readDeviceChoices()).toEqual(chosen);
  });

  it('leaves alone what the editor did not change, though it changed elsewhere meanwhile', () => {
    const was = readDeviceChoices();

    chooseTheme('dark');
    keepDeviceChoices({ ...was, connections: 1 }, was);

    expect(readDeviceChoices()).toMatchObject({ theme: 'dark', connections: 1 });
  });
});
