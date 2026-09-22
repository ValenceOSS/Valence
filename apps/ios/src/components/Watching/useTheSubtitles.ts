import { useEffect, useState } from 'react';
import { asSubtitleLines } from '@ValenceClient/playback/asSubtitleLines';
import { fetchSubtitleCues, subtitleCuesUrl } from '@ValenceClient/playback/fetchSubtitleCues';
import { subtitleTrackUrl, SUBTITLES_OFF } from '@ValenceClient/playback/fetchSubtitles';
import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';

/**
 * The lines of whichever track somebody is reading.
 *
 * Asked for as a script first and read as plain text where the server has none to give, which is
 * most tracks — a server that has never heard of the styled form answers the same way as one whose
 * track simply has no styling, so neither this nor the person reading has to know which.
 *
 * Nothing is fetched for a track that is burned into the picture. Those arrive already drawn, and
 * asking for them again would draw every line twice.
 *
 * @param mediaId - What is playing.
 * @param trackId - The track they are reading, or off.
 * @param isBurnedIn - Whether the server is drawing it into the picture itself.
 * @param fromSeconds - Where the stream began, since a track is timed against the whole film.
 * @returns The lines to draw.
 */
const useTheSubtitles = (
  mediaId: string,
  trackId: string,
  isBurnedIn: boolean,
  fromSeconds: number,
): SubtitleCue[] => {
  const [cues, setCues] = useState<SubtitleCue[]>([]);

  useEffect(() => {
    if (trackId === SUBTITLES_OFF || isBurnedIn) {
      setCues([]);

      return;
    }

    let stillWanted = true;

    void fetchSubtitleCues(subtitleCuesUrl(mediaId, trackId, fromSeconds))
      .then(async (styled) => {
        if (styled !== null) {
          return styled;
        }

        const plain = await fetch(subtitleTrackUrl(mediaId, trackId, fromSeconds))
          .then(async (answer) => (answer.ok ? answer.text() : null))
          .catch(() => null);

        return plain === null ? [] : asSubtitleLines(plain);
      })
      .then((found) => {
        if (stillWanted) {
          setCues(found);
        }
      });

    return () => {
      stillWanted = false;
    };
  }, [mediaId, trackId, isBurnedIn, fromSeconds]);

  return cues;
};

export { useTheSubtitles };
