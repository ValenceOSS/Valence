type Identified = {
  id: string;
  externalId: string | null;
  seriesId: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  extraKind: string | null;
};

type Succession = { from: string; to: string };

/**
 * Says what each leaving item is the same as among those staying: the same episode of the same
 * programme, or the film the catalogue matched both to. A file replaced by a better copy of itself
 * leaves and arrives in the same scan, and the arrival is what a viewer's place in it belongs to.
 * Extras, and anything the catalogue never matched, have nothing to be the same as.
 *
 * @param leaving - The items whose files have gone.
 * @param staying - The items still in the library.
 * @returns Which staying item each leaving one is succeeded by, where any is.
 */
const successorsOf = (
  leaving: readonly Identified[],
  staying: readonly Identified[],
): Succession[] =>
  leaving.flatMap((gone) => {
    if (gone.extraKind !== null) {
      return [];
    }

    const isEpisode =
      gone.seriesId !== null && gone.seasonNumber !== null && gone.episodeNumber !== null;
    const isFilm =
      gone.seriesId === null &&
      gone.seasonNumber === null &&
      gone.episodeNumber === null &&
      gone.externalId !== null;
    const next = staying.find((one) =>
      one.extraKind !== null || one.id === gone.id
        ? false
        : isEpisode
          ? one.seriesId === gone.seriesId &&
            one.seasonNumber === gone.seasonNumber &&
            one.episodeNumber === gone.episodeNumber
          : isFilm &&
            one.seriesId === null &&
            one.seasonNumber === null &&
            one.episodeNumber === null &&
            one.externalId === gone.externalId,
    );

    return next === undefined ? [] : [{ from: gone.id, to: next.id }];
  });

export type { Identified, Succession };

export { successorsOf };
