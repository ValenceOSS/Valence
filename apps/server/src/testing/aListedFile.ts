import type { ListedFile } from '@ValenceServer/metadata/listedTitlesOf';

/**
 * A file of a library as the titles list reads it, a film of one 1080p file unless told otherwise.
 *
 * @param id - The file.
 * @param change - What differs, with the summary's own changes under `summary`.
 * @returns The file.
 */
const aListedFile = (
  id: string,
  change: Partial<Omit<ListedFile, 'summary'>> & { summary?: Partial<ListedFile['summary']> } = {},
): ListedFile => {
  const { summary, ...rest } = change;

  return {
    summary: {
      id,
      libraryId: 'lib',
      title: id,
      year: 2020,
      durationSeconds: 6000,
      width: 1920,
      height: 1080,
      videoCodec: 'h264',
      videoRange: 'SDR',
      audio: { codec: 'aac', channels: 2, isAtmos: false },
      addedAt: '2026-01-01T00:00:00.000Z',
      hasPoster: true,
      hasBackdrop: true,
      hasLogo: false,
      seriesId: null,
      externalId: '603',
      genres: [],
      ...summary,
    },
    path: `/lib/${id}.mkv`,
    sizeBytes: 1000,
    parentId: null,
    originalTitle: null,
    seriesKey: null,
    episodeTotal: null,
    catalogueEpisodeId: null,
    hasOverview: true,
    tags: [],
    certification: null,
    hasSubtitles: false,
    ...rest,
  };
};

export { aListedFile };
