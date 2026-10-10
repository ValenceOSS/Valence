import type { AdminCommandId } from '@ValenceScreens/components/AdminArea/adminCommands';

let pending: AdminCommandId | null = null;

const listeners = new Set<() => void>();

/**
 * Asks for an action of the admin area to be carried out by whichever page holds it, now if that
 * page is showing, or as soon as it is.
 *
 * @param id - The action.
 */
const requestAdminCommand = (id: AdminCommandId): void => {
  pending = id;

  for (const listener of listeners) {
    listener();
  }
};

/**
 * Takes an action that was asked for, if it is this one, so it is carried out once.
 *
 * @param id - The action a page can carry out.
 * @returns Whether it was asked for.
 */
const takeAdminCommand = (id: AdminCommandId): boolean => {
  if (pending !== id) {
    return false;
  }

  pending = null;

  return true;
};

/**
 * Listens for actions being asked for.
 *
 * @param listener - Called whenever one is.
 * @returns A way to stop listening.
 */
const listenForAdminCommands = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export { listenForAdminCommands, requestAdminCommand, takeAdminCommand };
