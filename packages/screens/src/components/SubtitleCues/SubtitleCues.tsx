import { useEffect, useState } from 'react';
import { useSubtitleCues } from '@ValenceClient/playback/useSubtitleCues';
import { arrangeSubtitleLines } from '@ValenceClient/playback/arrangeSubtitleLines';
import { linesAt } from '@ValenceScreens/playback/linesAt';
import { toCuePlacement } from '@ValenceScreens/playback/toCuePlacement';
import { SubtitleLine } from './components/SubtitleLine/SubtitleLine';
import { pictureBox } from './pictureBox';
import { usePictureRatio } from './usePictureRatio';
import type { CSSProperties } from 'react';
import type { SubtitleRow } from '@ValenceClient/playback/arrangeSubtitleLines';
import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';
import type { SubtitleCuesProps } from './SubtitleCues.types';

const CLEAR_OF_THE_CONTROLS = '18%';

const NEAR_THE_EDGE = '8%';

const ROWS = ['top', 'middle', 'bottom'] as const satisfies readonly SubtitleRow[];

const STACKED: Record<SubtitleRow, string> = {
  top: 'flex-col',
  middle: 'flex-col',
  bottom: 'flex-col-reverse',
};

type LiveMoment = {
  seconds: number;
  cues: readonly SubtitleCue[];
  offsetSeconds: number;
};

/**
 * Subtitles drawn by the application rather than by the thing playing the film.
 *
 * A browser draws these itself, given a `track` element on the video it is playing. There is no
 * video element when the operating system is doing the playing — the picture is behind the window,
 * and nothing behind the window knows what this application's subtitles are or where its controls
 * sit. So the lines are read here and drawn as part of the page, over the picture, with the same
 * preferences a browser would have been handed.
 *
 * The lines come from the reader every client shares, which draws a script's plain text until its
 * own lines arrive and keeps asking while the server cannot answer, so a track is late rather than
 * blank.
 *
 * No two lines are drawn on the same spot. A line the script put at a point of its own goes there;
 * every other line joins the row its alignment names — along the top, across the middle or along the
 * foot — and stacks there with the rest. The foot stacks upwards, the first line said lowest and each
 * later one above it, as a renderer of the script stacks them, so a line being read stays where it is
 * when another starts. The rows move out of the way of the controls when they are up, which a browser
 * only manages through a positioning hint that has to be rewritten into the file.
 *
 * The rows are laid along the player, which is where the controls are. A line placed at a point is
 * placed on the picture instead, in a box of the picture's own shape centred in the player, so that
 * a sign lands on the shop front it names and is sized against the picture rather than in the bars
 * beside or above it when the player is not the film's shape.
 *
 * @param mediaId - What is playing.
 * @param track - The track being read.
 * @param atSeconds - Where playback is up to, offset included.
 * @param video - The video it is drawn over, whose clock it reads every frame where given, so a
 *   line comes and goes on the frame it should rather than on the browser's next quarter-second
 *   report of the time. A moment read against other lines or another offset is never used, so a
 *   line does not outstay a new track or a nudge to the timing.
 * @param picture - The picture the page's own engine draws on a canvas, where it draws one, whose
 *   size gives the picture's shape when the video carries only the sound.
 * @param offsetSeconds - How far the viewer has moved the subtitles against the picture, read
 *   against that clock.
 * @param style - How this viewer likes captions drawn.
 * @param isLifted - Whether the controls are up and the rows should keep clear of them.
 */
const SubtitleCues = ({
  mediaId,
  track,
  atSeconds,
  video,
  picture,
  offsetSeconds = 0,
  style,
  isLifted = false,
}: SubtitleCuesProps) => {
  const cues = useSubtitleCues(mediaId, track);
  const [live, setLive] = useState<LiveMoment | null>(null);
  const ratio = usePictureRatio(video, picture);

  useEffect(() => {
    if (video === undefined) {
      return undefined;
    }

    let frame = 0;
    let shown: string | null = null;

    const follow = () => {
      const element = video.current;

      if (element !== null) {
        const seconds = element.currentTime - offsetSeconds;
        const showing = linesAt(cues, seconds)
          .map((line) => `${line.from.toString()}:${line.to.toString()}`)
          .join(' ');

        if (showing !== shown) {
          shown = showing;
          setLive({ seconds, cues, offsetSeconds });
        }
      }

      frame = requestAnimationFrame(follow);
    };

    frame = requestAnimationFrame(follow);

    return () => {
      cancelAnimationFrame(frame);
    };
  }, [video, offsetSeconds, cues]);

  const isLive =
    video !== undefined &&
    live !== null &&
    live.cues === cues &&
    live.offsetSeconds === offsetSeconds;
  const arranged = arrangeSubtitleLines(linesAt(cues, isLive ? live.seconds : atSeconds));

  if (ROWS.every((row) => arranged.rows[row].length === 0) && arranged.placed.length === 0) {
    return null;
  }

  const edge = isLifted ? CLEAR_OF_THE_CONTROLS : NEAR_THE_EDGE;
  const rowAt: Record<SubtitleRow, CSSProperties> = {
    top: { top: edge },
    middle: { top: '50%', transform: 'translateY(-50%)' },
    bottom: { bottom: edge },
  };

  return (
    <div
      className="pointer-events-none absolute inset-0 z-10 [container-type:size]"
      aria-live="polite"
    >
      {ROWS.map((row) =>
        arranged.rows[row].length === 0 ? null : (
          <div
            key={row}
            className={`absolute inset-x-0 flex ${STACKED[row]} items-center gap-1 px-[8%]`}
            style={rowAt[row]}
          >
            {arranged.rows[row].map((cue, index) => (
              <SubtitleLine
                key={`${cue.from.toString()}-${index.toString()}`}
                cue={cue}
                style={style}
              />
            ))}
          </div>
        ),
      )}

      {arranged.placed.length === 0 ? null : (
        <div className="absolute [container-type:size]" style={pictureBox(ratio)}>
          {arranged.placed.map((cue, index) =>
            cue.position === null ? null : (
              <div
                key={`${cue.from.toString()}-${index.toString()}`}
                className="absolute flex flex-col"
                style={toCuePlacement(cue.position, cue.alignment)}
              >
                <SubtitleLine cue={cue} style={style} />
              </div>
            ),
          )}
        </div>
      )}
    </div>
  );
};

SubtitleCues.displayName = 'SubtitleCues';

export { SubtitleCues };
