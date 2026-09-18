import { useSyncExternalStore } from 'react';
import type { PartyCommand, WatchParty } from '@ValenceContracts/schemas/WatchParty';

type ListeningParty = {
  party: WatchParty;
  hostName: string;
  mayChoose: boolean;
  mayPlayPause: boolean;
  maySeek: boolean;
  send: (command: PartyCommand) => void;
};

let joined: ListeningParty | null = null;

const listeners = new Set<() => void>();

/**
 * Says which listening party this window is in, and what it may do there, or that it is in none.
 *
 * @param party - The party and what this window may do in it, or nothing.
 */
const setListeningParty = (party: ListeningParty | null): void => {
  joined = party;

  for (const listener of listeners) {
    listener();
  }
};

/**
 * Reads the listening party this window is in, outside a component.
 *
 * @returns The party, or nothing.
 */
const readListeningParty = (): ListeningParty | null => joined;

/**
 * Starts listening for the party changing.
 *
 * @param listener - What to call when it does.
 * @returns A way to stop.
 */
const subscribe = (listener: () => void): (() => void) => {
  listeners.add(listener);

  return () => {
    listeners.delete(listener);
  };
};

/**
 * Reads the listening party this window is in, so the player bar can hand the song and its place to
 * the host while leaving the volume where it is — the one thing each listener keeps for themselves.
 *
 * @returns The party and what this window may do in it, or nothing.
 */
const useListeningParty = (): ListeningParty | null =>
  useSyncExternalStore(subscribe, readListeningParty, readListeningParty);

export type { ListeningParty };

export { readListeningParty, setListeningParty, useListeningParty };
