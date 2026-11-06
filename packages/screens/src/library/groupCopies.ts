import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type GroupedCopies = {
  media: MediaSummary;
  copies: MediaSummary[];
};

/**
 * A title reduced to what two libraries' spellings of it share: lower case, without accents,
 * punctuation or a leading "the".
 *
 * @param title - The title.
 * @returns It reduced.
 */
const keyOfTitle = (title: string): string =>
  title
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/^the /u, '');

/**
 * What makes two entries the same title: a programme by its name — the year on its card is one
 * episode's, which two copies need not share — and a film by its catalogue id where it has one, by
 * its name and year where it does not.
 *
 * @param media - The entry.
 * @returns Its key.
 */
const keyOf = (media: MediaSummary): string =>
  media.seriesId !== null || (media.seriesTitle ?? null) !== null
    ? `show:${keyOfTitle(media.seriesTitle ?? media.title)}`
    : (media.externalId ?? null) !== null
      ? `film:${String(media.externalId)}`
      : `film:${keyOfTitle(media.title)}:${(media.year ?? '').toString()}`;

/**
 * Folds the copies of one title — this server's own and each linked server's — into one entry, so a
 * title several servers have is listed once: this server's own copy where it has one, standing for
 * the rest, which come with it. The order is the order each title first appeared in.
 *
 * @param items - The entries, a copy each.
 * @param isOwn - Whether an entry is this server's own.
 * @returns Each title once, with its other copies.
 */
const groupCopies = (
  items: readonly MediaSummary[],
  isOwn: (media: MediaSummary) => boolean,
): GroupedCopies[] => {
  const groups = new Map<string, MediaSummary[]>();

  for (const media of items) {
    const key = keyOf(media);
    const group = groups.get(key);

    if (group === undefined) {
      groups.set(key, [media]);
    } else {
      group.push(media);
    }
  }

  return [...groups.values()].flatMap((group) => {
    const media = group.find(isOwn) ?? group[0];

    return media === undefined
      ? []
      : [{ media, copies: group.filter((one) => one.id !== media.id) }];
  });
};

export type { GroupedCopies };

export { groupCopies };
