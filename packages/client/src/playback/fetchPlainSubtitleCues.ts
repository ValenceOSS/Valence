import { asSubtitleLines } from '@ValenceClient/playback/asSubtitleLines';
import { subtitleTrackUrl } from '@ValenceClient/playback/fetchSubtitles';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';

const NOT_FOUND = 404;

/**
 * Reads a track as WebVTT, in the shape a script's lines come in, which every text track has and
 * which is drawn while a script's own lines are on their way or where it has none.
 *
 * A track the server has nothing for is read as no lines. Anything else that goes wrong is thrown,
 * so whoever asked can ask again.
 *
 * @param mediaId - The title.
 * @param trackId - The track.
 * @param signal - Told when the lines are no longer wanted.
 * @returns The lines, dressed in nothing.
 */
const fetchPlainSubtitleCues = async (
  mediaId: string,
  trackId: string,
  signal?: AbortSignal,
): Promise<SubtitleCue[]> => {
  const url = subtitleTrackUrl(mediaId, trackId);
  const answer = await fetch(url, signal === undefined ? {} : { signal });

  if (answer.status === NOT_FOUND) {
    return [];
  }

  if (!answer.ok) {
    throw new RequestFailed(url, answer.status);
  }

  return asSubtitleLines(await answer.text());
};

export { fetchPlainSubtitleCues };
