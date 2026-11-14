import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { arrangeSubtitleLines } from '@ValenceClient/playback/arrangeSubtitleLines';
import { withOpacity } from '@ValenceClient/playback/captionStyle';
import { cornerOf } from '@ValenceClient/playback/cornerOf';
import { haloFor } from '@ValenceClient/playback/haloFor';
import { useSubtitleMoment } from '@ValenceClient/playback/useSubtitleMoment';
import { captionTextStyle } from '@ValenceNative/playback/captionTextStyle';
import { howItLinesUp } from '@ValenceClient/playback/howItLinesUp';
import { theCueAt } from '@ValenceMobile/components/Watching/theCueAt';
import { whereASignGoes } from '@ValenceMobile/components/Watching/whereASignGoes';
import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';
import type { CaptionTextStyle } from '@ValenceNative/playback/captionTextStyle';
import type { TheSubtitlesProps } from './TheSubtitles.types';

const READS_AT = 19;

const NEAR_THE_EDGE = 0.08;

const CLEAR_OF_THE_CONTROLS = 0.22;

const SMALLEST_SIGN = 11;

const LARGEST_SIGN = 0.12;

const OPAQUE = 1;

const HALO_OPACITY = 0.9;

const styles = StyleSheet.create({
  bold: { fontWeight: '700' },
  halo: { textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 3 },
  italic: { fontStyle: 'italic' },
  line: { borderRadius: 6, overflow: 'hidden', paddingHorizontal: 8, paddingVertical: 3 },
  low: { bottom: '8%' },
  middle: { bottom: 0, justifyContent: 'center', top: 0 },
  placed: { position: 'absolute' },
  raised: { bottom: '22%' },
  row: { alignItems: 'center', gap: 3, left: 0, position: 'absolute', right: 0 },
  sign: { backgroundColor: 'transparent' },
  whole: { bottom: 0, left: 0, position: 'absolute', right: 0, top: 0 },
});

/**
 * How large to draw part of a sign the script sized, as a share of the frame's height held between
 * something still readable on a phone and something that does not cover the picture.
 *
 * @param fontHeight - The size the script gave it, as a share of its own frame's height.
 * @param frameTall - How tall the film's frame is drawn.
 * @returns The size to draw it at, in points.
 */
const signSizeOf = (fontHeight: number, frameTall: number): number =>
  Math.max(SMALLEST_SIGN, Math.min(fontHeight * frameTall, LARGEST_SIGN * frameTall));

/**
 * The key a line is drawn under, which takes its place in the list as well as its times, since two
 * lines of a script often start and stop together.
 *
 * @param cue - The line.
 * @param at - Where it is in the list it is drawn from.
 * @returns The key.
 */
const keyOf = (cue: SubtitleCue, at: number): string =>
  `${at.toString()}:${cue.from.toString()}:${cue.to.toString()}`;

/**
 * Draws the lines of one row, each in the style this phone draws lines in, bold or italic where the
 * track made part of it so, and kept to the left, the middle or the right as its alignment asks.
 *
 * @param lines - The row's lines, in the order the script has them.
 * @param caption - How this phone draws a line.
 * @returns The lines.
 */
const linesOf = (lines: readonly SubtitleCue[], caption: CaptionTextStyle) =>
  lines.map((cue, at) => (
    <Text
      key={keyOf(cue, at)}
      style={[styles.line, caption, howItLinesUp(cornerOf(cue.alignment).across)]}
    >
      {cue.spans.map((span, part) => (
        <Text key={part} style={[span.isBold && styles.bold, span.isItalic && styles.italic]}>
          {span.text}
        </Text>
      ))}
    </Text>
  ));

/**
 * The lines somebody is reading, drawn over the film.
 *
 * Drawn rather than handed to the player, because the player has never heard of them: what this
 * server sends is one picture with one sound on it, and a subtitle is a separate thing fetched
 * beside it. Every other Valence client draws its own for the same reason.
 *
 * Lines go in three rows, at the foot, in the middle and at the top, by the alignment the track
 * gave them, each a column so two lines showing at once are stacked rather than drawn over each
 * other, and each kept to the left, the middle or the right of its row as its alignment asks. The
 * row at the foot stacks upwards, the earliest line lowest, so a line being read stays where it is
 * when another starts. They are drawn as this phone likes them and in nothing the track dressed them
 * in, apart from bold and italic, so they read on the box somebody chose to read them on. The rows at
 * the foot and the top keep clear of the controls while those are up, and the one at the top keeps
 * clear of the notch as well; the lines of the middle row join the end of the top row while the
 * controls are up, rather than sitting behind the button in the middle of them.
 *
 * A line the script put at a point of its own, such as a sign typeset over the thing it names, is
 * drawn at that point of the film's frame wherever the frame is on the screen, in the colour and at
 * the size the script gave it, outlined rather than boxed so it reads over any picture: dark round
 * light lettering and light round dark.
 *
 * The player says where it is four times a second, so the moment the lines are picked at moves on
 * between those reports while the film plays, and a line comes and goes on time.
 *
 * @param cues - Every line in the track being read.
 * @param atSeconds - Where the film has got to.
 * @param isPlaying - Whether the film is playing, which is when the moment moves on by itself.
 * @param isClearOfTheControls - Whether the controls are up and the lines should keep clear of them.
 * @param captionStyle - How somebody likes the lines drawn on this phone.
 * @param frame - Where the film's whole frame is drawn on the screen, where its size is known.
 * @param screen - The size of the screen the film is drawn on.
 */
const TheSubtitles = ({
  cues,
  atSeconds,
  isPlaying,
  isClearOfTheControls,
  captionStyle,
  frame,
  screen,
}: TheSubtitlesProps) => {
  const room = useSafeAreaInsets();
  const moment = useSubtitleMoment(cues, atSeconds, isPlaying);
  const { rows, placed } = arrangeSubtitleLines(theCueAt(cues, moment));

  if (rows.top.length + rows.middle.length + rows.bottom.length + placed.length === 0) {
    return null;
  }

  const caption = captionTextStyle(captionStyle, READS_AT);
  const top = isClearOfTheControls ? [...rows.top, ...rows.middle] : rows.top;
  const middle = isClearOfTheControls ? [] : rows.middle;
  const shown = frame ?? { left: 0, top: 0, width: screen.width, height: screen.height };
  const aside = { paddingHorizontal: Math.max(room.left, room.right) };
  const fromTheTop = Math.max(
    room.top,
    screen.height * (isClearOfTheControls ? CLEAR_OF_THE_CONTROLS : NEAR_THE_EDGE),
  );

  return (
    <View pointerEvents="none" style={styles.whole}>
      {top.length === 0 ? null : (
        <View style={[styles.row, aside, { top: fromTheTop }]}>{linesOf(top, caption)}</View>
      )}

      {middle.length === 0 ? null : (
        <View style={[styles.row, styles.middle, aside]}>{linesOf(middle, caption)}</View>
      )}

      {rows.bottom.length === 0 ? null : (
        <View style={[styles.row, aside, isClearOfTheControls ? styles.raised : styles.low]}>
          {linesOf(rows.bottom, caption).reverse()}
        </View>
      )}

      {placed.map((cue, at) => {
        if (cue.position === null) {
          return null;
        }

        const { textAlign, ...box } = whereASignGoes(cue.position, cue.alignment, shown, screen);

        return (
          <View key={keyOf(cue, at)} style={[styles.placed, box]}>
            <Text style={[caption, styles.sign, { textAlign }]}>
              {cue.spans.map((span, part) => (
                <Text
                  key={part}
                  style={[
                    styles.halo,
                    {
                      color:
                        span.colour === null
                          ? caption.color
                          : withOpacity(span.colour, span.opacity ?? OPAQUE),
                      fontSize:
                        span.fontHeight === null
                          ? caption.fontSize
                          : signSizeOf(span.fontHeight, shown.height),
                      textShadowColor: withOpacity(
                        haloFor(span.colour ?? captionStyle.color),
                        HALO_OPACITY * (span.opacity ?? OPAQUE),
                      ),
                    },
                    span.isBold && styles.bold,
                    span.isItalic && styles.italic,
                  ]}
                >
                  {span.text}
                </Text>
              ))}
            </Text>
          </View>
        );
      })}
    </View>
  );
};

TheSubtitles.displayName = 'TheSubtitles';

export { TheSubtitles };
