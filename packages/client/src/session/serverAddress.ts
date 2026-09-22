import { z } from 'zod';
import { platformInUse } from '@ValenceClient/platform/installPlatform';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';

const KEY = 'valence.server.address';

const RECENT_KEY = 'valence.server.recent';

const RECENT_KEPT = 5;

const RecentSchema = z.array(z.string().min(1));

/**
 * Reads the server a client with a window of its own was told to watch.
 *
 * A browser never asks: its pages came from the server. A client with a window of its own is asked
 * once, before it has anything to show, and the answer is what its window then opens on.
 *
 * @returns The address, or nothing where this client has not been told one.
 */
const serverAddress = (): string | null => {
  const held = platformInUse().store.read(KEY);

  return held === null || held === '' ? null : held;
};

/**
 * Reads the servers this client has been pointed at before, the latest first, for offering again
 * rather than having somebody type one they already typed.
 *
 * Kept apart from the address in use, which is forgotten whenever somebody asks for a different
 * server — the moment they most want to be shown the ones they had.
 *
 * @returns The addresses, or none where nothing has been kept or what was kept cannot be read.
 */
const recentServerAddresses = (): string[] => {
  const held = platformInUse().store.read(RECENT_KEY);

  if (held === null) {
    return [];
  }

  try {
    const read = RecentSchema.safeParse(JsonValueSchema.parse(JSON.parse(held)));

    return read.success ? read.data : [];
  } catch {
    return [];
  }
};

/**
 * Remembers the server a viewer named, so they are asked once rather than at every launch, and
 * among the ones they have used, so it can be offered again after they move to another.
 *
 * Only an address something answered at is ever handed here, so nothing mistyped is kept.
 *
 * @param address - Where their Valence is, or nothing to forget it.
 */
const rememberServerAddress = (address: string | null): void => {
  if (address === null || address === '') {
    platformInUse().store.forget(KEY);

    return;
  }

  platformInUse().store.write(KEY, address);

  const recent = [address, ...recentServerAddresses().filter((one) => one !== address)];

  platformInUse().store.write(RECENT_KEY, JSON.stringify(recent.slice(0, RECENT_KEPT)));
};

export { RECENT_KEPT, recentServerAddresses, rememberServerAddress, serverAddress };
