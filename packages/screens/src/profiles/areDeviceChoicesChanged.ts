import type { DeviceChoices } from '@ValenceScreens/components/ProfileSettings/ProfileSettings.types';

const CHOICES: readonly (keyof DeviceChoices)[] = [
  'language',
  'theme',
  'motion',
  'pluginTheme',
  'playsInTheBrowser',
  'connections',
  'streamingFormat',
  'showsDesktopNotices',
  'appIcon',
];

/**
 * Whether a draft changes anything this device had chosen for itself as the editor opened.
 *
 * @param draft - The draft, which holds the device's choices and what they were.
 * @returns Whether saving it would change any of them.
 */
const areDeviceChoicesChanged = (draft: DeviceChoices & { deviceWas: DeviceChoices }): boolean =>
  CHOICES.some((choice) => draft.deviceWas[choice] !== draft[choice]);

export { areDeviceChoicesChanged };
