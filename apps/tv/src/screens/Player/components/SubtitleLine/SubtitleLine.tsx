import { StyleSheet, Text, View } from 'react-native';
import { arrangeSubtitleLines } from '@ValenceClient/playback/arrangeSubtitleLines';
import { cornerOf } from '@ValenceClient/playback/cornerOf';
import { howItLinesUp } from '@ValenceClient/playback/howItLinesUp';
import { useSubtitleMoment } from '@ValenceClient/playback/useSubtitleMoment';
import { captionTextStyle } from '@ValenceNative/playback/captionTextStyle';
import { tokens } from '@ValenceTv/theme/tokens';
import type { ArrangedLines, SubtitleRow } from '@ValenceClient/playback/arrangeSubtitleLines';
import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';
import type { CaptionTextStyle } from '@ValenceNative/playback/captionTextStyle';
import type { SubtitleLineProps } from './SubtitleLine.types';

const LIFTS_BY = 300;

const LOWERS_BY = 220;

/**
 * The lines drawn in one row: its own, then each the script put at a point of its own in the third
 * of the picture the row stands for.
 *
 * @param arranged - The lines showing, sorted into rows and lines placed at a point.
 * @param row - The row.
 * @returns The row's lines, in the order the script has them.
 */
const rowOf = ({ rows, placed }: ArrangedLines, row: SubtitleRow): SubtitleCue[] => [
  ...rows[row],
  ...placed.filter((cue) => cornerOf(cue.alignment).down === row),
];

/**
 * Draws the lines of one row, each as this television draws lines, each part in the weight and
 * slant the track gave it, and each kept to the left, the middle or the right as its alignment asks,
 * keyed by its place in the row as well as its times, since two lines of a script often start and
 * stop together.
 *
 * @param lines - The row's lines, in the order the script has them.
 * @param caption - How this television draws a line.
 * @returns The lines.
 */
const linesOf = (lines: readonly SubtitleCue[], caption: CaptionTextStyle) =>
  lines.map((cue, at) => (
    <Text
      key={`${at.toString()}:${cue.from.toString()}:${cue.to.toString()}`}
      style={[styles.text, caption, howItLinesUp(cornerOf(cue.alignment).across)]}
    >
      {cue.spans.map((span, part) => (
        <Text key={part} style={[span.isBold && styles.bold, span.isItalic && styles.italic]}>
          {span.text}
        </Text>
      ))}
    </Text>
  ));

/**
 * The subtitles for the moment playing, drawn over the picture as this television has been set to
 * draw them, each part in the weight and slant the track gave it.
 *
 * Lines go in three rows, at the foot, in the middle and at the top, by the alignment the track gave
 * them, each a column so that two lines showing at once are stacked rather than drawn over each
 * other, and each kept to the left, the middle or the right of its row as its alignment asks. The
 * row at the foot stacks upwards, the earliest line lowest, so a line being read stays where it is
 * when another starts. A line a script put at a point of its own, a sign typeset over the picture or
 * dialogue moved off the foot, joins the end of the row its alignment names and is drawn as every
 * other line is: from across a room a sign at its own point and size is lost in the film.
 *
 * The rows at the foot and the top move clear of the controls while those are showing, rather than
 * being hidden behind them.
 *
 * The player says where it is only twice a second, so while it plays each line is put up or taken
 * down at its own moment rather than at the next report.
 *
 * @param cues - The track's lines, each with when it starts and stops.
 * @param position - The moment playing, in seconds, as the player last said.
 * @param isPlaying - Whether it is playing, which is when the moment moves on between reports.
 * @param isLifted - Whether the controls are showing.
 * @param captionStyle - How this television draws the lines.
 */
const SubtitleLine = ({ cues, position, isPlaying, isLifted, captionStyle }: SubtitleLineProps) => {
  const moment = useSubtitleMoment(cues, position, isPlaying);
  const arranged = arrangeSubtitleLines(
    cues.filter((cue) => moment >= cue.from && moment < cue.to),
  );
  const top = rowOf(arranged, 'top');
  const middle = rowOf(arranged, 'middle');
  const bottom = rowOf(arranged, 'bottom');

  if (top.length + middle.length + bottom.length === 0) {
    return null;
  }

  const caption = captionTextStyle(captionStyle, tokens.type.heading);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {top.length === 0 ? null : (
        <View style={[styles.row, styles.top, isLifted && { top: LOWERS_BY }]}>
          {linesOf(top, caption)}
        </View>
      )}

      {middle.length === 0 ? null : (
        <View style={[styles.row, styles.middle]}>{linesOf(middle, caption)}</View>
      )}

      {bottom.length === 0 ? null : (
        <View style={[styles.row, styles.bottom, isLifted && { bottom: LIFTS_BY }]}>
          {linesOf(bottom, caption).reverse()}
        </View>
      )}
    </View>
  );
};

SubtitleLine.displayName = 'SubtitleLine';

const styles = StyleSheet.create({
  row: {
    position: 'absolute',
    left: tokens.space.edge,
    right: tokens.space.edge,
    alignItems: 'center',
  },
  bottom: { bottom: tokens.space.xl * 1.5 },
  top: { top: tokens.space.xl },
  middle: { top: 0, bottom: 0, justifyContent: 'center' },
  text: { paddingHorizontal: tokens.space.xs },
  bold: { fontWeight: '800' },
  italic: { fontStyle: 'italic' },
});

export { SubtitleLine };
