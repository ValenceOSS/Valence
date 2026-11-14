import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';

const KEY = 'valence.jellyfin.ids';

const MOST_KEPT = 20_000;

const BookSchema = z.record(z.string(), z.string());

const HEX = /^[0-9a-f]{32}$/u;

/**
 * Writes thirty-two hexadecimal digits as a UUID.
 *
 * @param hex - The digits.
 * @returns The UUID.
 */
const asUuid = (hex: string): string =>
  `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;

/**
 * Turns Jellyfin's identifiers into ones Valence's apps accept, and back. Jellyfin's are thirty-two
 * digits made from a hash, which a UUID check refuses for the version and variant they happen to
 * have; the same digits marked as a version 8 UUID are accepted, and the six bits the mark replaces
 * are kept in the device's store, so an identifier handed out turns back into Jellyfin's after a
 * restart too.
 *
 * @param store - The device's store.
 * @returns How to turn an identifier each way.
 */
const createJellyfinIdBook = (store: DeviceStore) => {
  const read = (): Record<string, string> => {
    try {
      const held = BookSchema.safeParse(JsonValueSchema.parse(JSON.parse(store.read(KEY) ?? '{}')));

      return held.success ? held.data : {};
    } catch {
      return {};
    }
  };

  const book = new Map(Object.entries(read()));

  const keep = (): void => {
    const kept = [...book.entries()].slice(-MOST_KEPT);

    store.write(KEY, JSON.stringify(Object.fromEntries(kept)));
  };

  let isWaiting = false;

  const keepSoon = (): void => {
    if (isWaiting) {
      return;
    }

    isWaiting = true;
    queueMicrotask(() => {
      isWaiting = false;
      keep();
    });
  };

  return {
    valenceIdOf: (jellyfinId: string): string => {
      const hex = jellyfinId.replaceAll('-', '').toLowerCase();

      if (!HEX.test(hex)) {
        return jellyfinId;
      }

      const variant = ((Number.parseInt(hex[16] ?? '8', 16) & 0x3) | 0x8).toString(16);
      const marked = `${hex.slice(0, 12)}8${hex.slice(13, 16)}${variant}${hex.slice(17)}`;

      if (marked !== hex && book.get(marked) !== hex) {
        book.set(marked, hex);
        keepSoon();
      }

      return asUuid(marked);
    },
    jellyfinIdOf: (valenceId: string): string => {
      const hex = valenceId.replaceAll('-', '').toLowerCase();

      return book.get(hex) ?? hex;
    },
  };
};

type JellyfinIdBook = ReturnType<typeof createJellyfinIdBook>;

export type { JellyfinIdBook };

export { createJellyfinIdBook };
