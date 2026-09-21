type SeriesEvidence = {
  externalId: string | null;
  seriesFolder: string | null;
  seriesTitle: string | null;
};

/**
 * Works out which programme a file belongs to, as a key that survives the file being renamed: the
 * folder holding it, then the catalogue's identifier, then the series title.
 *
 * The folder comes first because it is the one thing every episode of a programme agrees on before
 * anybody has been asked. Reading the catalogue's identifier first split programmes in two whenever
 * a lookup failed — a timeout on half a season filed those episodes under a second programme of the
 * same name, and it stayed that way, because the shelf remembered a network failure as though it
 * were a fact about the library. A folder cannot time out.
 *
 * The cost is that moving a programme to a different folder reads as a different programme. That is
 * the trade every scanner makes one way or the other, and it is the better way round: a person
 * moves a folder deliberately and rarely, where a catalogue fails on its own and often.
 *
 * @param options - The catalogue identifier, the series folder and the series title, as far as each
 *   is known.
 * @returns The key to group by, or null where nothing identifies a programme at all.
 */
const resolveSeriesKey = ({
  externalId,
  seriesFolder,
  seriesTitle,
}: SeriesEvidence): string | null => {
  if (seriesTitle === null || seriesTitle === '') {
    return null;
  }

  if (seriesFolder !== null && seriesFolder !== '') {
    return `folder:${seriesFolder}`;
  }

  if (externalId !== null && externalId !== '') {
    return `catalogue:${externalId}`;
  }

  return `title:${seriesTitle.toLowerCase()}`;
};

export { resolveSeriesKey };
