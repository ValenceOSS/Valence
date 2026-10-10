import { useEffect, useRef } from 'react';
import JASSUB from 'jassub';
import { fetchSubtitleFonts } from '@ValenceClient/playback/fetchSubtitleFonts';
import { subtitleScriptUrl } from '@ValenceClient/playback/subtitleScriptUrl';
import type { AssSubtitlesProps } from './AssSubtitles.types';

/**
 * Draws a styled subtitle track exactly as its script was typeset, through libass: every sign in
 * the font the file carries for it, at the size and place the script gives, moving, fading and
 * clipped as the script says. It follows the video itself, so it stays in step through seeking and
 * pausing without being told, and draws again at once when the subtitles are moved, paused or
 * not. Draws nothing of its own on the page — libass paints onto a canvas
 * laid over the video.
 *
 * @param video - The video it is drawn over.
 * @param mediaId - The title.
 * @param trackId - The styled track to draw.
 * @param offsetSeconds - How far the viewer has moved the subtitles against the picture, later where
 *   positive.
 */
const AssSubtitles = ({ video, mediaId, trackId, offsetSeconds }: AssSubtitlesProps) => {
  const drawn = useRef<JASSUB | null>(null);
  const offset = useRef(offsetSeconds);

  offset.current = offsetSeconds;

  useEffect(() => {
    const element = video.current;
    let isGone = false;

    if (element === null) {
      return undefined;
    }

    void fetchSubtitleFonts(mediaId).then((fonts) => {
      if (isGone) {
        return;
      }

      const renderer = new JASSUB({
        video: element,
        subUrl: subtitleScriptUrl(mediaId, trackId),
        fonts,
        queryFonts: false,
      });

      renderer.timeOffset = -offset.current;
      drawn.current = renderer;
    });

    return () => {
      isGone = true;
      void drawn.current?.destroy();
      drawn.current = null;
    };
  }, [video, mediaId, trackId]);

  useEffect(() => {
    if (drawn.current !== null) {
      drawn.current.timeOffset = -offsetSeconds;
      void drawn.current.resize(true);
    }
  }, [offsetSeconds]);

  return null;
};

AssSubtitles.displayName = 'AssSubtitles';

export { AssSubtitles };
