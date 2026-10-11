import { useEffect, useRef } from 'react';
import JASSUB from 'jassub';
import { PictureCanvas } from '@ValenceUI/PictureCanvas';
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
 * Where the browser's own player draws the picture instead, the video element holds only the sound
 * and tells libass neither the picture's size nor when a frame is shown, so libass is given a canvas
 * of its own, laid over the picture at the picture's shape, and told the time on every animation
 * frame.
 *
 * @param video - The video it is drawn over.
 * @param mediaId - The title.
 * @param trackId - The styled track to draw.
 * @param offsetSeconds - How far the viewer has moved the subtitles against the picture, later where
 *   positive.
 * @param picture - The size of the picture the browser's own player draws, where it draws it.
 */
const AssSubtitles = ({
  video,
  mediaId,
  trackId,
  offsetSeconds,
  picture = null,
}: AssSubtitlesProps) => {
  const drawn = useRef<JASSUB | null>(null);
  const offset = useRef(offsetSeconds);
  const surfaceRef = useRef<HTMLCanvasElement>(null);
  const width = picture?.width ?? null;
  const height = picture?.height ?? null;

  useEffect(() => {
    const element = video.current;
    const surface = surfaceRef.current;
    const isOwnCanvas = width !== null && height !== null;
    const life: { isGone: boolean; frame: number | null } = { isGone: false, frame: null };

    if (element === null || (isOwnCanvas && surface === null)) {
      return undefined;
    }

    void fetchSubtitleFonts(mediaId).then((fonts) => {
      if (life.isGone) {
        return;
      }

      const renderer = new JASSUB({
        ...(isOwnCanvas && surface !== null ? { canvas: surface } : { video: element }),
        subUrl: subtitleScriptUrl(mediaId, trackId),
        fonts,
        queryFonts: false,
      });

      renderer.timeOffset = -offset.current;
      drawn.current = renderer;

      if (isOwnCanvas) {
        const tick = () => {
          void renderer.manualRender({
            mediaTime: element.currentTime,
            expectedDisplayTime: performance.now(),
            width,
            height,
          });
          life.frame = requestAnimationFrame(tick);
        };

        life.frame = requestAnimationFrame(tick);
      }
    });

    return () => {
      life.isGone = true;

      if (life.frame !== null) {
        cancelAnimationFrame(life.frame);
      }

      void drawn.current?.destroy();
      drawn.current = null;
    };
  }, [video, mediaId, trackId, width, height]);

  useEffect(() => {
    offset.current = offsetSeconds;

    if (drawn.current !== null) {
      drawn.current.timeOffset = -offsetSeconds;
      void drawn.current.resize(true);
    }
  }, [offsetSeconds]);

  if (width === null || height === null) {
    return null;
  }

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center [container-type:size]">
      <PictureCanvas
        key={`${width.toString()}x${height.toString()}`}
        canvasRef={surfaceRef}
        isShown
        className="bg-transparent"
        aspectRatio={width / height}
      />
    </div>
  );
};

AssSubtitles.displayName = 'AssSubtitles';

export { AssSubtitles };
