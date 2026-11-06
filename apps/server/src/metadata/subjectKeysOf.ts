type KeyedFile = {
  path: string;
  externalId: string | null;
  seriesKey: string | null;
  seasonNumber: number | null;
  episodeNumber: number | null;
  catalogueEpisodeId: string | null;
  extraKind: string | null;
};

type SubjectKeys =
  | { kind: 'film'; film: string }
  | { kind: 'episode'; show: string; season: string | null; episode: string | null }
  | { kind: 'none' };

/**
 * Works out which titles a file's metadata belongs to, as the keys an administrator's edits are
 * kept under: a film by its catalogue id, a programme by its catalogue id, a season by its number
 * within the programme, and an episode by the catalogue's own id for it, so renumbering never cuts
 * an edit loose. A title the catalogue has not matched is kept by its file, or by the programme's
 * own key, until it is. Extras hold no edits of their own.
 *
 * @param file - The file's path, its catalogue id, its programme's key, and its numbering.
 * @returns The keys, or none where the file is an extra.
 */
const subjectKeysOf = (file: KeyedFile): SubjectKeys => {
  if (file.extraKind !== null) {
    return { kind: 'none' };
  }

  const matched = file.externalId !== null && file.externalId !== '' ? file.externalId : null;

  if (file.seriesKey === null) {
    return { kind: 'film', film: matched === null ? `file:${file.path}` : `movie:${matched}` };
  }

  const show = matched === null ? `series:${file.seriesKey}` : `tv:${matched}`;
  const season = file.seasonNumber === null ? null : `${show}:s${file.seasonNumber.toString()}`;
  const episode =
    matched !== null && file.catalogueEpisodeId !== null
      ? `${show}:e${file.catalogueEpisodeId}`
      : season !== null && file.episodeNumber !== null
        ? `${season}e${file.episodeNumber.toString()}`
        : null;

  return { kind: 'episode', show, season, episode };
};

export type { KeyedFile, SubjectKeys };

export { subjectKeysOf };
