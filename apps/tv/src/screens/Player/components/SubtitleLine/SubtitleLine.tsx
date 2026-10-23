import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { captionTextStyle } from '@ValenceNative/playback/captionTextStyle';
import { tokens } from '@ValenceTv/theme/tokens';
import type { SubtitleLineProps } from './SubtitleLine.types';

const LIFTS_BY = 300;

const MOST_AHEAD_SECONDS = 1;

/**
 * The subtitles for the moment playing, drawn over the foot of the picture as this television has been
 * set to draw them, each part in the weight and slant the track gave it.
 *
 * They rise above the controls while those are showing, rather than being hidden behind them.
 *
 * The player says where it is only twice a second, so a line timed by that alone arrived up to half a
 * second late. While it plays, each line is put up or taken down at its own moment, worked out from
 * the last position said, and never more than a second past it, so a stalled picture does not leave
 * the words running on without it.
 *
 * @param cues - The track's lines, each with when it starts and stops.
 * @param position - The moment playing, in seconds, as the player last said.
 * @param isPlaying - Whether it is playing, which is when the moment moves on between reports.
 * @param isLifted - Whether the controls are showing beneath.
 * @param captionStyle - How this television draws the lines.
 */
const SubtitleLine = ({ cues, position, isPlaying, isLifted, captionStyle }: SubtitleLineProps) => {
  const [told, setTold] = useState(position);
  const [reached, setReached] = useState(position);

  if (told !== position) {
    setTold(position);
    setReached(position);
  }

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const next = cues.reduce<number | null>((soonest, cue) => {
      const edge = cue.from > reached ? cue.from : cue.to > reached ? cue.to : null;

      return edge === null || (soonest !== null && soonest <= edge) ? soonest : edge;
    }, null);

    if (next === null || next - told > MOST_AHEAD_SECONDS) {
      return undefined;
    }

    const timer = setTimeout(
      () => {
        setReached(next);
      },
      (next - reached) * 1000,
    );

    return () => {
      clearTimeout(timer);
    };
  }, [cues, reached, told, isPlaying]);

  const showing = cues.filter((cue) => reached >= cue.from && reached < cue.to && !cue.isSign);

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
