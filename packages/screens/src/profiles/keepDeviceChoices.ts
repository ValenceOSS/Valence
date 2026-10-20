import { chooseDeviceNotices } from '@ValenceClient/notifications/deviceNotices';
import { choosePluginTheme } from '@ValenceClient/plugins/pluginThemeChoice';
import { chooseMotion } from '@ValenceClient/shell/motion';
import { chooseTheme } from '@ValenceClient/shell/theme';
import { writePlaybackPreferences } from '@ValenceScreens/playback/playbackPreferences';
import type { DeviceChoices } from '@ValenceScreens/components/ProfileSettings/ProfileSettings.types';

/**
 * Keeps on this device what the profile editor changed, once the editor is saved, and leaves alone
 * whatever it did not change, so a theme chosen elsewhere while the editor was open stays chosen.
 *
 * @param choices - What the editor ends with.
 * @param was - What the device used as the editor opened.
 */
const keepDeviceChoices = (choices: DeviceChoices, was: DeviceChoices): void => {
  if (choices.theme !== was.theme) {
    chooseTheme(choices.theme);
  }

  if (choices.motion !== was.motion) {
    chooseMotion(choices.motion);
  }

  if (choices.pluginTheme !== was.pluginTheme) {
    choosePluginTheme(choices.pluginTheme);
  }

  writePlaybackPreferences({
    ...(choices.playsInTheBrowser === was.playsInTheBrowser
      ? {}
      : { playsInTheBrowser: choices.playsInTheBrowser }),
    ...(choices.connections === was.connections ? {} : { connections: choices.connections }),
    ...(choices.streamingFormat === was.streamingFormat
      ? {}
      : { streamingFormat: choices.streamingFormat }),
  });

  if (choices.showsDesktopNotices !== was.showsDesktopNotices) {
    chooseDeviceNotices(choices.showsDesktopNotices);
  }
};

export { keepDeviceChoices };
