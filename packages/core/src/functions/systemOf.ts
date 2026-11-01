import type { DeviceForm, DeviceSystem } from '@ValenceContracts/schemas/DeviceIdentity';

type SeenSystem = { system: DeviceSystem; form: DeviceForm };

const ANDROID = /\bAndroid\b/u;

const ANDROID_PHONE = /\bMobile\b/u;

const SYSTEMS: readonly (SeenSystem & { pattern: RegExp })[] = [
  { system: 'ipados', form: 'tablet', pattern: /\biPad\b/u },
  { system: 'ios', form: 'phone', pattern: /\biPhone\b|\biPod\b/u },
  { system: 'chromeos', form: 'computer', pattern: /\bCrOS\b/u },
  { system: 'macos', form: 'computer', pattern: /\bMacintosh\b|\bMac OS X\b/u },
  { system: 'windows', form: 'computer', pattern: /\bWindows\b/u },
  { system: 'linux', form: 'computer', pattern: /\bLinux\b|\bX11\b/u },
];

/**
 * Which system a browser runs on, and so what shape of thing it is, from its user agent: an iPhone or
 * an iPad by name, an Android phone where it says it is mobile and an Android tablet where it does
 * not, a Chromebook by its own mark rather than as the Linux it says it also is, and a computer by its
 * system.
 *
 * @param userAgent - What the browser says it is.
 * @returns The system and the shape, or nothing where it names no system this knows.
 */
const systemOf = (userAgent: string): SeenSystem | null => {
  if (ANDROID.test(userAgent)) {
    return { system: 'android', form: ANDROID_PHONE.test(userAgent) ? 'phone' : 'tablet' };
  }

  const seen = SYSTEMS.find(({ pattern }) => pattern.test(userAgent));

  return seen === undefined ? null : { system: seen.system, form: seen.form };
};

export type { SeenSystem };

export { systemOf };
