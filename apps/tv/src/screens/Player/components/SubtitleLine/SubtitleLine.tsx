import { StyleSheet, Text, View } from 'react-native';
import { captionTextStyle } from '@ValenceNative/playback/captionTextStyle';
import { tokens } from '@ValenceTv/theme/tokens';
import type { SubtitleLineProps } from './SubtitleLine.types';

const LIFTS_BY = 300;

/**
 * The subtitles for the moment playing, drawn over the foot of the picture as this television has been
 * set to draw them, each part in the weight and slant the track gave it.
 *
 * They rise above the controls while those are showing, rather than being hidden behind them.
 *
 * @param cues - The track's lines, each with when it starts and stops.
 * @param position - The moment playing, in seconds.
 * @param isLifted - Whether the controls are showing beneath.
 * @param captionStyle - How this television draws the lines.
 */
const SubtitleLine = ({ cues, position, isLifted, captionStyle }: SubtitleLineProps) => {
  const showing = cues.filter((cue) => position >= cue.from && position < cue.to && !cue.isSign);

  if (showing.length === 0) {
    return null;
  }

  return (
    <View style={[styles.line, isLifted && { bottom: LIFTS_BY }]} pointerEvents="none">
      {showing.map((cue) => (
        <Text
          key={`${cue.from.toString()}:${cue.to.toString()}`}
          style={[styles.text, captionTextStyle(captionStyle, tokens.type.heading)]}
        >
          {cue.spans.map((span, at) => (
            <Text key={at} style={[span.isBold && styles.bold, span.isItalic && styles.italic]}>
              {span.text}
            </Text>
          ))}
        </Text>
      ))}
    </View>
  );
};

SubtitleLine.displayName = 'SubtitleLine';

const styles = StyleSheet.create({
  line: {
    position: 'absolute',
    left: tokens.space.edge,
    right: tokens.space.edge,
    bottom: tokens.space.xl * 1.5,
    alignItems: 'center',
  },
  text: {
    textAlign: 'center',
    paddingHorizontal: tokens.space.xs,
  },
  bold: { fontWeight: '800' },
  italic: { fontStyle: 'italic' },
});

export { SubtitleLine };
