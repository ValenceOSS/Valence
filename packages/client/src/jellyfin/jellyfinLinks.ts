import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { DeviceStore } from '@ValenceClient/platform/Platform.types';
import type { JellyfinLink } from '@ValenceClient/jellyfin/JellyfinLink';

const KEY = 'valence.jellyfin.links';

const LinkSchema = z.object({
  address: z.string().min(1),
  serverId: z.string().min(1),
  serverName: z.string(),
  token: z.string().nullable(),
  userId: z.string().nullable(),
  userName: z.string().nullable(),
  isAdministrator: z.boolean().default(false),
});

const LinksSchema = z.array(LinkSchema);

/**
 * The Jellyfin servers this device knows, by their address, kept in the device's own store so a
 * server is known to be Jellyfin, and somebody stays signed in to it, after the app restarts.
 *
 * @param store - The device's store.
 * @returns How to read, keep and forget the link to a server.
 */
const jellyfinLinks = (store: DeviceStore) => {
  const all = (): JellyfinLink[] => {
    const held = store.read(KEY);

    if (held === null) {
      return [];
    }

    try {
      const read = LinksSchema.safeParse(JsonValueSchema.parse(JSON.parse(held)));

      return read.success ? read.data : [];
    } catch {
      return [];
    }
  };

  return {
    of: (address: string | null): JellyfinLink | null =>
      address === null ? null : (all().find((link) => link.address === address) ?? null),
    keep: (link: JellyfinLink): void => {
      store.write(
        KEY,
        JSON.stringify([...all().filter((one) => one.address !== link.address), link]),
      );
    },
    forget: (address: string): void => {
      store.write(KEY, JSON.stringify(all().filter((one) => one.address !== address)));
    },
  };
};

export { jellyfinLinks };
