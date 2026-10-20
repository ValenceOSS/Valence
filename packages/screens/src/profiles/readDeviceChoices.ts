import { areDeviceNoticesOn } from '@ValenceClient/notifications/deviceNotices';
import { chosenPluginTheme } from '@ValenceClient/plugins/pluginThemeChoice';
import { chosenMotion } from '@ValenceClient/shell/motion';
import { chosenTheme } from '@ValenceClient/shell/theme';
import { readPlaybackPreferences } from '@ValenceScreens/playback/playbackPreferences';
import type { DeviceChoices } from '@ValenceScreens/components/ProfileSettings/ProfileSettings.types';

/**
 * Reads what this device has chosen for itself — its theme, movement, plugin theme, how it plays
 * and whether it shows notices — so the profile editor starts from what is in force here.
 *
 * @returns This device's choices.
 */
const readDeviceChoices = (): DeviceChoices => {
  const playback = readPlaybackPreferences();

  return {
    theme: chosenTheme(),
    motion: chosenMotion(),
    pluginTheme: chosenPluginTheme(),
    playsInTheBrowser: playback.playsInTheBrowser,
    connections: playback.connections,
    streamingFormat: playback.streamingFormat,
    showsDesktopNotices: areDeviceNoticesOn(),
  };
};

export { readDeviceChoices };
