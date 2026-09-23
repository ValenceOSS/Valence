type ControlledDevice = { clientId: string; label: string };

let controlled: ControlledDevice | null = null;

const listeners = new Set<() => void>();

/**
 * Which of this person's devices this one is the remote for — the television a film was sent to —
 * or nothing.
 *
 * @returns The device, or nothing.
 */
const readControlledDevice = (): ControlledDevice | null => controlled;

/**
 * Makes this device the remote for another, or stops it being one.
 *
 * @param device - The device to control, or nothing.
 */
const controlDevice = (device: ControlledDevice | null): void => {
  if (controlled?.clientId === device?.clientId) {
    return;
  }

  controlled = device;
  listeners.forEach((listener) => {
    listener();
  });
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

export { controlDevice, onControlledDevice, readControlledDevice };
