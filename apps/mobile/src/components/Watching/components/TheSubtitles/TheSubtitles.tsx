import { StyleSheet, Text, View } from 'react-native';
import { captionTextStyle } from '@ValenceNative/playback/captionTextStyle';
import { theCueAt } from '@ValenceMobile/components/Watching/theCueAt';
import type { TheSubtitlesProps } from './TheSubtitles.types';

const READS_AT = 19;

const styles = StyleSheet.create({
  line: {
    borderRadius: 6,
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 3,
    textAlign: 'center',
  },
  lines: { alignItems: 'center', gap: 3 },
  low: { bottom: '8%' },
  raised: { bottom: '22%' },
  whole: { alignItems: 'center', left: 0, position: 'absolute', right: 0 },
});

/**
 * The lines somebody is reading, drawn over the film.
 *
 * Drawn rather than handed to the player, because the player has never heard of them: what this
 * server sends is one picture with one sound on it, and a subtitle is a separate thing fetched
 * beside it. Every other Valence client draws its own for the same reason.
 *
 * They lift clear of the controls while those are up. A line of dialogue hidden behind a scrubber
 * is a line somebody has to press pause to read.
 *
 * What a script asked for — where on screen, in what colour, bold or not — is kept, because a film
 * that puts a sign in the corner meant it there. Only the words are drawn here; where a line was
 * placed by hand it keeps its own place.
 *
 * @param cues - Every line in the track being read.
 * @param atSeconds - Where the film has got to.
 * @param isClearOfTheControls - Whether the controls are up and the lines should sit above them.
 * @param captionStyle - How somebody likes the lines drawn on this phone.
 */
const TheSubtitles = ({
  cues,
  atSeconds,
  isClearOfTheControls,
  captionStyle,
}: TheSubtitlesProps) => {
  const showing = theCueAt(cues, atSeconds);

  if (showing.length === 0) {
    return null;
  }

  return (
    <View
      pointerEvents="none"
      style={[styles.whole, isClearOfTheControls ? styles.raised : styles.low]}
    >
      <View style={styles.lines}>
        {showing.map((cue) => (
          <Text
            key={`${cue.from.toString()}-${cue.to.toString()}`}
            style={[
              styles.line,
              captionTextStyle(captionStyle, READS_AT),
              cue.spans[0]?.colour === null ? null : { color: cue.spans[0]?.colour },
            ]}
          >
            {cue.spans.map((span) => span.text).join('')}
          </Text>
        ))}
      </View>
    </View>
  );
};

TheSubtitles.displayName = 'TheSubtitles';

export { TheSubtitles };
