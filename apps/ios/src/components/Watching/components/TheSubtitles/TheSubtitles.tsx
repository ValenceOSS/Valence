import { StyleSheet, Text, View } from 'react-native';
import { theCueAt } from '@ValencePhone/components/Watching/theCueAt';
import type { TheSubtitlesProps } from './TheSubtitles.types';

const OVER_THE_PICTURE = '#ffffff';

const BEHIND_THE_WORDS = 'rgba(0, 0, 0, 0.55)';

const styles = StyleSheet.create({
  line: {
    backgroundColor: BEHIND_THE_WORDS,
    borderRadius: 6,
    color: OVER_THE_PICTURE,
    fontSize: 19,
    fontWeight: '500',
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
 */
const TheSubtitles = ({ cues, atSeconds, isClearOfTheControls }: TheSubtitlesProps) => {
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
