import { chooseDeviceNotices } from '@ValenceClient/notifications/deviceNotices';
import { choosePluginTheme } from '@ValenceClient/plugins/pluginThemeChoice';
import { chooseMotion } from '@ValenceClient/shell/motion';
import { chooseTheme } from '@ValenceClient/shell/theme';
import { writePlaybackPreferences } from '@ValenceScreens/playback/playbackPreferences';
import type { DeviceChoices } from '@ValenceScreens/components/ProfileSettings/ProfileSettings.types';

/**
 * Keeps on this device what the profile editor chose for it, once the editor is saved.
 *
 * @param choices - What this device should now use.
 */
const keepDeviceChoices = (choices: DeviceChoices): void => {
  chooseTheme(choices.theme);
  chooseMotion(choices.motion);
  choosePluginTheme(choices.pluginTheme);
  writePlaybackPreferences({
    playsInTheBrowser: choices.playsInTheBrowser,
    connections: choices.connections,
    streamingFormat: choices.streamingFormat,
  });
  chooseDeviceNotices(choices.showsDesktopNotices);
};

export { keepDeviceChoices };
