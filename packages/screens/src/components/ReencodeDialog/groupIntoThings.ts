import type { MediaSummary } from '@ValenceContracts/schemas/Library';

type FileGroup = {
  key: string;
  title: string;
  items: MediaSummary[];
  sizeBytes: number;
};

/**
 * Orders two files the way somebody reads them: by season, then by episode, then by name for
 * anything numbered neither way.
 *
 * @param left - One file.
 * @param right - The other.
 * @returns Which comes first, as a comparator.
 */
const inOrder = (left: MediaSummary, right: MediaSummary): number =>
  (left.seasonNumber ?? 0) - (right.seasonNumber ?? 0) ||
  (left.episodeNumber ?? 0) - (right.episodeNumber ?? 0) ||
  left.title.localeCompare(right.title);

/**
 * Which thing a file belongs to: its programme, or the film it is a cut or an extra of, or itself.
 *
 * @param item - The file.
 * @returns The key of the thing it belongs to.
 */
const thingOf = (item: MediaSummary): string => item.seriesTitle ?? item.parentId ?? item.id;

/**
 * What to call a group, which is the thing rather than whichever of its files came first.
 *
 * @param items - The files in it.
 * @returns What to call it.
 */
const titleOf = (items: readonly MediaSummary[]): string =>
  items.find((one) => one.seriesTitle !== null && one.seriesTitle !== undefined)?.seriesTitle ??
  items.find((one) => one.parentId === null || one.parentId === undefined)?.title ??
  items[0]?.title ??
  '';

/**
 * Gathers files into the things a person thinks of them as.
 *
 * One file is rarely one thing. A programme is forty episodes; a film somebody cares about is often
 * the theatrical cut and the director's, or a remux and the trailer that came with it. A shelf that
 * lists every file flat is not something anybody picks from, and it buries the question actually
 * being asked — a whole series, or a whole film with its cuts, is usually what somebody means to
 * re-encode, and a single file is the exception they drill into.
 *
 * So the rule is the same for both: a file belongs to its programme, or to the film it is a cut or
 * an extra of, or to itself. Anything that ends up alone is offered as an ordinary row, which is
 * what an ordinary film is.
 *
 * Only what it was given. Grouping happens after searching and after the size rule, so a total is
 * the total of what is on screen rather than of what exists — a programme filtered down to three
 * episodes says what those three cost, which is what ticking it would act on.
 *
 * @param items - The files to gather, already filtered.
 * @returns The groups, in reading order, each with what it costs.
 */
const groupIntoThings = (items: readonly MediaSummary[]): FileGroup[] => {
  const byThing = new Map<string, MediaSummary[]>();

  for (const item of items) {
    const key = thingOf(item);

    byThing.set(key, [...(byThing.get(key) ?? []), item]);
  }

  return [...byThing]
    .map(([key, held]) => ({
      key,
      title: titleOf(held),
      items: [...held].sort(inOrder),
      sizeBytes: held.reduce((total, one) => total + (one.sizeBytes ?? 0), 0),
    }))
    .sort((left, right) => left.title.localeCompare(right.title));
};

export type { FileGroup };

export { groupIntoThings, thingOf, titleOf };
