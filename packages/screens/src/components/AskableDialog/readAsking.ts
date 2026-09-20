import { MediaRequestKindSchema } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

/**
 * Reads which title an address is asking about, out of what it carries: its kind and the id it
 * was listed under, as `film:438631` or `album:deezer-7`.
 *
 * @param asking - What the address carries, or nothing.
 * @returns The title's kind and id, or null where the address names none that could be one.
 */
const readAsking = (asking: string | null): { kind: MediaRequestKind; id: string } | null => {
  if (asking === null) {
    return null;
  }

  const split = asking.indexOf(':');
  const kind = MediaRequestKindSchema.safeParse(asking.slice(0, split));
  const id = asking.slice(split + 1);

  return split === -1 || !kind.success || id === '' ? null : { kind: kind.data, id };
};

export { readAsking };
