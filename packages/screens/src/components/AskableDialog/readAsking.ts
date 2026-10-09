import { MediaRequestKindSchema } from '@ValenceContracts/schemas/MediaRequest';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

const MORE = ':more';

/**
 * Reads which title an address is asking about, out of what it carries: its kind and the id it
 * was listed under, as `film:438631` or `album:deezer-7`, and whether more of something already in
 * the library is being asked for, as `series:95396:more`.
 *
 * @param asking - What the address carries, or nothing.
 * @returns The title's kind and id, or null where the address names none that could be one.
 */
const readAsking = (
  asking: string | null,
): { kind: MediaRequestKind; id: string; isMore?: true } | null => {
  if (asking === null) {
    return null;
  }

  const isMore = asking.endsWith(MORE);
  const named = isMore ? asking.slice(0, -MORE.length) : asking;
  const split = named.indexOf(':');
  const kind = MediaRequestKindSchema.safeParse(named.slice(0, split));
  const id = named.slice(split + 1);

  if (split === -1 || !kind.success || id === '') {
    return null;
  }

  return isMore ? { kind: kind.data, id, isMore } : { kind: kind.data, id };
};

export { readAsking };
