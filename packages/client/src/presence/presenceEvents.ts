import type { PresenceEvent } from '@ValenceClient/presence/PresenceEventSchema';

type PresenceEventListener = (event: PresenceEvent) => void;

const listeners = new Set<PresenceEventListener>();

/**
 * Passes an action an operator took — a stream stopped, a message sent — from this tab's presence
 * connection to whichever player is currently mounted. Only those listening when it arrives hear
 * it, so a player opened by the action itself — the next episode — is not told it again.
 *
 * @param event - What the operator did.
 */
const emitPresenceEvent = (event: PresenceEvent): void => {
  const listening = Array.from(listeners);

  for (const listener of listening) {
    listener(event);
  }
};

/**
 * Listens for actions an operator takes against this tab, which arrive down the presence connection
 * rather than being asked for.
 *
 * @param listener - Told each action as it arrives.
 * @returns The function that stops listening.
 */
const onPresenceEvent = (listener: PresenceEventListener): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

export type { PresenceEvent };

export { emitPresenceEvent, onPresenceEvent };
