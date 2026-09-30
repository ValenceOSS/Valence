/**
 * Describes a media item with only what its table insists on, for a test to write before the rows
 * that refer to it.
 *
 * @param id - Its id, which is also its title and names its file.
 * @param libraryId - The library it is in.
 * @returns The row.
 */
const aMediaItemRow = (id: string, libraryId: string) => ({
  id,
  libraryId,
  path: `/${libraryId}/${id}.mkv`,
  title: id,
  sizeBytes: 1000,
  modifiedAtMs: 0,
  container: 'mkv',
  durationSeconds: 5400,
  videoCodec: 'h264',
  videoRange: 'SDR',
  width: 1920,
  height: 1080,
  audioStreams: [],
  subtitleStreams: [],
});

export { aMediaItemRow };
