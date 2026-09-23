import { useQuery } from '@tanstack/react-query';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { lyricLineAt } from '@ValenceClient/music/lyricLineAt';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { TheLyricsProps } from './TheLyrics.types';

const styles = StyleSheet.create({
  lines: { gap: 10 },
});

/**
 * A track's words, as the web shows them beside the player: where they are timed, the line being
 * sung stands out and the ones already sung fade back; where they are not, they are simply there.
 *
 * @param trackId - Whose words.
 * @param atSeconds - Where the track is.
 */
const TheLyrics = ({ trackId, atSeconds }: TheLyricsProps) => {
  const colours = useTheColours();
  const read = useQuery(musicQueries.lyrics(trackId));

  if (read.isPending) {
    return <ActivityIndicator color={colours.textMuted} />;
  }

  if (read.data === null || read.data === undefined || read.data.lines.length === 0) {
    return <Words tone="muted">There are no words for this one.</Words>;
  }

  const { lines, isSynced } = read.data;
  const sung = isSynced ? lyricLineAt(lines, atSeconds * 1000) : -1;

  return (
    <View style={styles.lines}>
      {lines.map((line, at) => (
        <Words
          key={`${at.toString()}:${line.text}`}
          size="heading"
          {...(isSynced && at !== sung ? { tone: 'muted' } : {})}
        >
          {line.text === '' ? ' ' : line.text}
        </Words>
      ))}
    </View>
  );
};

TheLyrics.displayName = 'TheLyrics';

export { TheLyrics };
