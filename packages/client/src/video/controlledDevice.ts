type ControlledDevice = { clientId: string; label: string };

const STOPPED_FOR_MS = 120_000;

let controlled: ControlledDevice | null = null;

const listeners = new Set<() => void>();

const dismissed = new Map<string, number | null>();

/**
 * Tells everybody listening that the device being controlled has changed.
 */
const tellListeners = (): void => {
  listeners.forEach((listener) => {
    listener();
  });
};

/**
 * Which of this person's devices this one is the remote for — the television a film was sent to —
 * or nothing.
 *
 * @returns The device, or nothing.
 */
const readControlledDevice = (): ControlledDevice | null => controlled;

/**
 * Makes this device the remote for another, or stops it being one. Choosing a device undoes having
 * put its remote away.
 *
 * @param device - The device to control, or nothing.
 */
const controlDevice = (device: ControlledDevice | null): void => {
  if (device !== null) {
    dismissed.delete(device.clientId);
  }

  if (controlled?.clientId === device?.clientId) {
    return;
  }

  controlled = device;
  tellListeners();
};

/**
 * Puts away the remote for a device without stopping what it plays, and keeps this device from
 * following it again until it has properly stopped — not merely moved on to the next episode.
 *
 * @param clientId - The device.
 */
const dismissDevice = (clientId: string): void => {
  dismissed.set(clientId, null);

  if (controlled?.clientId === clientId) {
    controlled = null;
    tellListeners();
  }
};

/**
 * Whether the remote for a device was put away, and the device has not stopped since.
 *
 * @param clientId - The device.
 * @returns Whether to leave it alone.
 */
const isDismissed = (clientId: string): boolean => dismissed.has(clientId);

/**
 * Takes in which devices are watching something now, so a device whose remote was put away is
 * followed again once it has stopped for a couple of minutes and starts something new. A gap
 * shorter than that is one episode giving way to the next, and the remote stays away.
 *
 * @param watching - The devices watching something now.
 * @param now - The time now, in milliseconds.
 */
const noteWhoIsWatching = (watching: ReadonlySet<string>, now: number): void => {
  for (const [clientId, stoppedAt] of dismissed) {
    if (!watching.has(clientId)) {
      if (stoppedAt === null) {
        dismissed.set(clientId, now);
      }
    } else if (stoppedAt !== null) {
      if (now - stoppedAt < STOPPED_FOR_MS) {
        dismissed.set(clientId, null);
      } else {
        dismissed.delete(clientId);
      }
    }
  }
};

/**
 * Hears each time this device starts or stops being a remote for another.
 *
 * @param listener - Told on every change.
 * @returns What to call to stop listening.
 */
const onControlledDevice = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export type { ControlledDevice };

export {
  controlDevice,
  dismissDevice,
  isDismissed,
  noteWhoIsWatching,
  onControlledDevice,
  readControlledDevice,
};
