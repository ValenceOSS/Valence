import type { DeviceSystem } from '@ValenceContracts/schemas/DeviceIdentity';
import { say } from '@ValenceI18n/say';

/* oxlint-disable valence/no-hard-coded-strings -- systems' own product names, which are not translated */
const SYSTEM_NAMES: Readonly<Record<DeviceSystem, string>> = {
  ios: 'iOS',
  ipados: 'iPadOS',
  android: say('common.android'),
  macos: 'macOS',
  windows: say('common.windows'),
  linux: say('common.linux'),
  chromeos: 'ChromeOS',
  tvos: 'tvOS',
  androidTv: say('common.androidTV'),
  fireOs: 'Fire OS',
  webos: 'webOS',
  tizen: 'Tizen',
  xbox: say('common.xbox'),
};
/* oxlint-enable valence/no-hard-coded-strings */

/**
 * The name a system goes by, as its maker writes it.
 *
 * @param system - The system.
 * @returns Its name.
 */
const nameTheSystem = (system: DeviceSystem): string => SYSTEM_NAMES[system];

export { nameTheSystem };
