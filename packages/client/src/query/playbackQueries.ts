import { queryOptions } from '@tanstack/react-query';
import { fetchSegments } from '@ValenceClient/playback/fetchSegments';
import { fetchChapters } from '@ValenceClient/playback/fetchChapters';
import { fetchTrickplay } from '@ValenceClient/playback/fetchTrickplay';
import { fetchSubtitleTracks } from '@ValenceClient/playback/fetchSubtitles';
import { fetchSubtitleCues, subtitleCuesUrl } from '@ValenceClient/playback/fetchSubtitleCues';
import { fetchPlainSubtitleCues } from '@ValenceClient/playback/fetchPlainSubtitleCues';

const PLAYBACK = ['playback'] as const;

const FIRST_WAIT_MS = 500;

const LONGEST_WAIT_MS = 30_000;

/**
 * How long to wait before asking for a track's lines again, longer each time and never longer
 * than half a minute.
 *
 * @param attempt - How many times it has been asked already.
 * @returns The wait, in milliseconds.
 */
const waitBeforeAskingAgain = (attempt: number): number =>
  Math.min(FIRST_WAIT_MS * 2 ** attempt, LONGEST_WAIT_MS);

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
 * A script's lines, kept where they go and dressed as they were, or null where the track has no
 * styled form. Asked for again, ever more patiently, for as long as somebody is reading it and the
 * server could not answer, since the first read of a large file can outlast a request.
 *
 * @param mediaId - The title.
 * @param trackId - The track.
 * @returns The query.
 */
const styledCues = (mediaId: string, trackId: string) =>
  queryOptions({
    queryKey: [...PLAYBACK, 'cues', 'styled', mediaId, trackId],
    queryFn: ({ signal }) => fetchSubtitleCues(subtitleCuesUrl(mediaId, trackId), signal),
    staleTime: Infinity,
    retry: true,
    retryDelay: waitBeforeAskingAgain,
  });

/**
 * A track's lines read as WebVTT and dressed in nothing, which every text track has. Asked for
 * again the same way as a script's.
 *
 * @param mediaId - The title.
 * @param trackId - The track.
 * @returns The query.
 */
const plainCues = (mediaId: string, trackId: string) =>
  queryOptions({
    queryKey: [...PLAYBACK, 'cues', 'plain', mediaId, trackId],
    queryFn: ({ signal }) => fetchPlainSubtitleCues(mediaId, trackId, signal),
    staleTime: Infinity,
    retry: true,
    retryDelay: waitBeforeAskingAgain,
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

const playbackQueries = {
  segments,
  chapters,
  subtitleTracks,
  styledCues,
  plainCues,
  trickplay,
  key: PLAYBACK,
};

export { playbackQueries };
