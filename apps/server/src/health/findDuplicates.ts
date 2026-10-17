type Placed = {
  id: string;
  externalId: string | null;
  seriesId: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
};

/**
 * Finds the titles in a library that are there more than once: a film matched to the same catalogue
 * entry twice, or an episode of a series filed twice under the same season and number.
 *
 * @param items - Every top-level item, with what it was matched to and where it sits.
 * @returns Each duplicated item's id, with a key naming the group it is duplicated within.
 */
const findDuplicates = (items: readonly Placed[]): Map<string, string> => {
  const groups = new Map<string, string[]>();

  for (const item of items) {
    const key =
      item.seriesId !== null
        ? item.seasonNumber === null || item.episodeNumber === null
          ? null
          : `${item.seriesId}:${item.seasonNumber.toString()}:${item.episodeNumber.toString()}`
        : item.externalId === null || item.externalId === ''
          ? null
          : `film:${item.externalId}`;

    if (key !== null) {
      groups.set(key, [...(groups.get(key) ?? []), item.id]);
    }
  }

  return new Map(
    [...groups.entries()]
      .filter(([, ids]) => ids.length > 1)
      .flatMap(([key, ids]) => ids.map((id) => [id, key] as const)),
  );
};

export { findDuplicates };
