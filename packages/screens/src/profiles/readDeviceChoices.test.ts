import { afterEach, describe, expect, it } from 'vitest';
import { chooseDeviceNotices } from '@ValenceClient/notifications/deviceNotices';
import { choosePluginTheme } from '@ValenceClient/plugins/pluginThemeChoice';
import { chooseMotion } from '@ValenceClient/shell/motion';
import { chooseTheme } from '@ValenceClient/shell/theme';
import { writePlaybackPreferences } from '@ValenceScreens/playback/playbackPreferences';
import { readDeviceChoices } from './readDeviceChoices';

afterEach(() => {
  window.localStorage.clear();
});

describe('readDeviceChoices', () => {
  it('reads what a device that has chosen nothing uses', () => {
    expect(readDeviceChoices()).toEqual({
      theme: 'system',
      motion: 'system',
      pluginTheme: null,
      playsInTheBrowser: false,
      connections: 3,
      streamingFormat: 'hls',
      showsDesktopNotices: false,
    });
  });

  it('reads what this device has chosen', () => {
    chooseTheme('dark');
    chooseMotion('reduced');
    choosePluginTheme('midnight/deep-sea');
    writePlaybackPreferences({ playsInTheBrowser: true, connections: 1, streamingFormat: 'dash' });
    chooseDeviceNotices(true);

    expect(readDeviceChoices()).toEqual({
      theme: 'dark',
      motion: 'reduced',
      pluginTheme: 'midnight/deep-sea',
      playsInTheBrowser: true,
      connections: 1,
      streamingFormat: 'dash',
      showsDesktopNotices: true,
    });
  });
});
