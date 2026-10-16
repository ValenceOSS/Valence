import type { AddedItem } from '@ValenceServer/notifications/summariseNewMedia';

type DigestPart = {
  items: AddedItem[];
  only?: string[];
  except?: string[];
};

/**
 * The film, the programme or the album an item belongs to, as a request names what it brought.
 *
 * @param item - The item.
 * @returns Its film, programme or album.
 */
const titleOf = (item: AddedItem): string => item.seriesId ?? item.albumId ?? item.id;

/**
 * Who hears of what in a digest. Somebody who asked for a film, a programme or an album is told when
 * it is ready, so the digest leaves it out for them, rather than saying it twice: everybody else
 * hears of everything, and each of them hears of the rest.
 *
 * @param items - Everything imported since the last digest.
 * @param askedFor - What each person asked for, by account, as the films, programmes and albums
 *   their requests brought.
 * @returns Each part of the household and what it hears of.
 */
const splitDigest = (
  items: readonly AddedItem[],
  askedFor: ReadonlyMap<string, ReadonlySet<string>>,
): DigestPart[] => {
  const askers = [...askedFor].filter(([, titles]) =>
    items.some((item) => titles.has(titleOf(item))),
  );

  return [
    { items: [...items], ...(askers.length === 0 ? {} : { except: askers.map(([id]) => id) }) },
    ...askers.map(([id, titles]) => ({
      items: items.filter((item) => !titles.has(titleOf(item))),
      only: [id],
    })),
  ];
};

export { splitDigest };
