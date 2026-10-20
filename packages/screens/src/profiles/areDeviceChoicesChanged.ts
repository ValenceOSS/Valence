import { readDeviceChoices } from './readDeviceChoices';
import type { DeviceChoices } from '@ValenceScreens/components/ProfileSettings/ProfileSettings.types';

const CHOICES: readonly (keyof DeviceChoices)[] = [
  'theme',
  'motion',
  'pluginTheme',
  'playsInTheBrowser',
  'connections',
  'streamingFormat',
  'showsDesktopNotices',
];

/**
 * Whether a draft would change anything this device has chosen for itself.
 *
 * @param draft - The draft, which holds the device's choices among the rest.
 * @returns Whether saving it would change any of them.
 */
const areDeviceChoicesChanged = (draft: DeviceChoices): boolean => {
  const kept = readDeviceChoices();

  return CHOICES.some((choice) => kept[choice] !== draft[choice]);
};

export { areDeviceChoicesChanged };
