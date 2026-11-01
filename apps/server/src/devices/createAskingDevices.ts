import type { RequestDevice } from '@ValenceServer/devices/deviceOfRequest';

const KEPT_FOR_MS = 10 * 60 * 1000;

const MOST_KEPT = 500;

type AskingDevice = RequestDevice & { address: string | null };

type AskingDevices = {
  note: (userCode: string, device: AskingDevice) => void;
  read: (userCode: string) => AskingDevice | null;
};

/**
 * The same code however it was typed: in capitals, without the dash a screen shows it with.
 *
 * @param userCode - The code.
 * @returns It, as it is kept.
 */
const keyOf = (userCode: string): string => userCode.replaceAll(/[^A-Za-z0-9]/gu, '').toUpperCase();

/**
 * Which device asked for each code shown on a television, and from where, for as long as a code
 * lasts, so that somebody typing it on their phone is told which television they are letting in. Only the newest
 * few hundred are kept, so a flood of asking cannot fill the server's memory.
 *
 * @param now - The clock.
 * @returns Where asking devices are kept.
 */
const createAskingDevices = (now: () => number = Date.now): AskingDevices => {
  const asked = new Map<string, { device: AskingDevice; at: number }>();

  return {
    note: (userCode, device) => {
      const at = now();

      for (const [key, kept] of asked) {
        if (at - kept.at > KEPT_FOR_MS || asked.size >= MOST_KEPT) {
          asked.delete(key);
        }
      }

      asked.delete(keyOf(userCode));
      asked.set(keyOf(userCode), { device, at });
    },

    read: (userCode) => {
      const kept = asked.get(keyOf(userCode));

      return kept === undefined || now() - kept.at > KEPT_FOR_MS ? null : kept.device;
    },
  };
};

export type { AskingDevice, AskingDevices };

export { createAskingDevices };
