import { queryOptions } from '@tanstack/react-query';
import { fetchSegments } from '@ValenceClient/playback/fetchSegments';
import { fetchChapters } from '@ValenceClient/playback/fetchChapters';
import { fetchTrickplay } from '@ValenceClient/playback/fetchTrickplay';
import { fetchSubtitleTracks } from '@ValenceClient/playback/fetchSubtitles';
import { fetchSubtitleCues, subtitleCuesUrl } from '@ValenceClient/playback/fetchSubtitleCues';

const PLAYBACK = ['playback'] as const;

/**
 * The parts of a title somebody might want to skip — its intro, its recap, its credits — found by
 * listening for what its episodes share.
 *
 * @param mediaId - The title.
 * @returns The query.
 */
const segments = (mediaId: string) =>
  queryOptions({
    queryKey: [...PLAYBACK, 'segments', mediaId],
    queryFn: () => fetchSegments(mediaId),
  });

/**
 * The chapters a title's file marks, for naming them along its timeline.
 *
 * @param mediaId - The title.
 * @returns The query.
 */
const chapters = (mediaId: string) =>
  queryOptions({
    queryKey: [...PLAYBACK, 'chapters', mediaId],
    queryFn: () => fetchChapters(mediaId),
    staleTime: Infinity,
  });

/**
 * The subtitle tracks a title has, whether carried in its file or kept beside it.
 *
 * @param mediaId - The title.
 * @returns The query.
 */
const subtitleTracks = (mediaId: string) =>
  queryOptions({
    queryKey: [...PLAYBACK, 'subtitles', mediaId],
    queryFn: () => fetchSubtitleTracks(mediaId),
  });

/**
 * The lines of one subtitle track, each with when it starts and stops, for a client that draws its
 * own subtitles over the picture. None where the track could not be read.
 *
 * @param mediaId - The title.
 * @param trackId - The track.
 * @returns The query.
 */
const cues = (mediaId: string, trackId: string) =>
  queryOptions({
    queryKey: [...PLAYBACK, 'cues', mediaId, trackId],
    queryFn: async () => (await fetchSubtitleCues(subtitleCuesUrl(mediaId, trackId))) ?? [],
  });

/**
 * The thumbnails of a title laid out along its length, for showing where a scrub would land.
 *
 * @param mediaId - The title.
 * @returns The query.
 */
const trickplay = (mediaId: string) =>
  queryOptions({
    queryKey: [...PLAYBACK, 'trickplay', mediaId],
    queryFn: () => fetchTrickplay(mediaId),
    staleTime: Infinity,
  });

const playbackQueries = { segments, chapters, subtitleTracks, cues, trickplay, key: PLAYBACK };

export { playbackQueries };
