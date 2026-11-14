import { cornerOf } from '@ValenceClient/playback/cornerOf';
import { howItLinesUp } from '@ValenceClient/playback/howItLinesUp';
import { toSpanStyle } from '@ValenceScreens/playback/toSpanStyle';
import { toCueDeclarations } from '@ValenceScreens/playback/captionStyle';
import { dialogueFontSize } from '@ValenceScreens/playback/dialogueFontSize';
import { haloEdge } from './haloEdge';
import type { SubtitleLineProps } from './SubtitleLine.types';

/**
 * One line of subtitles, dressed for what it is and lined up left, centre or right as its alignment
 * asks.
 *
 * Dialogue is the viewer's, and takes the caption preferences they set — those exist so that
 * somebody who needs large lettering on a solid ground can read at all, and a file is not entitled to
 * overrule that. It is sized by the picture's height, so it grows with the player on a large or dense
 * screen rather than staying the size of the page's text.
 *
 * A sign is the author's: a shop front, a caption, a note in the corner of the frame, drawn how the
 * script asked so that it reads as part of the picture. The viewer's edge is still drawn round it, on
 * each run of its lettering, so that an outline measured against the lettering is as heavy on a sign
 * drawn large as on one drawn small. It keeps the viewer's shape and thickness but not always their
 * dark ink: dark lettering is ringed in light, as a script's own border would ring it.
 *
 * @param cue - The line.
 * @param style - How this viewer likes captions drawn.
 */
const SubtitleLine = ({ cue, style }: SubtitleLineProps) => {
  const viewer = toCueDeclarations(style);
  const { across } = cornerOf(cue.alignment);
  const lineUp = howItLinesUp(across);

  return (
    <p
      className="max-w-full rounded px-2 py-0.5 leading-snug whitespace-pre-line"
      style={
        cue.isSign ? lineUp : { ...viewer, ...lineUp, fontSize: dialogueFontSize(style.fontScale) }
      }
    >
      {cue.isSign
        ? cue.spans.map((span, at) => (
            <span
              key={`${at.toString()}-${span.text}`}
              style={{ ...toSpanStyle(span), textShadow: haloEdge(viewer.textShadow, span.colour) }}
            >
              {span.text}
            </span>
          ))
        : cue.spans.map((span) => span.text).join('')}
    </p>
  );
};

SubtitleLine.displayName = 'SubtitleLine';

export { SubtitleLine };
