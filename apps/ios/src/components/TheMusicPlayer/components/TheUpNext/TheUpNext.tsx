import { StyleSheet, View } from 'react-native';
import { upcomingIn } from '@ValenceClient/music/playQueue';
import { Button } from '@ValencePhone/components/Button/Button';
import { Words } from '@ValencePhone/components/Words/Words';
import { useTheMusic } from '@ValencePhone/hooks/useTheMusic';

const styles = StyleSheet.create({
  row: { gap: 2, paddingVertical: 8 },
});

/**
 * What plays after this, in the order it will play, as the web's queue lists it; pressing one
 * skips to it.
 */
const TheUpNext = () => {
  const { player, state } = useTheMusic();
  const coming = state.queue === null ? [] : upcomingIn(state.queue);

  if (coming.length === 0) {
    return <Words tone="muted">Nothing after this.</Words>;
  }

  return (
    <View>
      {coming.map(({ at, track }) => (
        <Button
          key={`${track.id}:${at.toString()}`}
          tone="bare"
          label={`Play ${track.title}`}
          onPress={() => {
            player.jumpTo(at);
          }}
        >
          <View style={styles.row}>
            <Words lines={1}>{track.title}</Words>
            <Words size="small" tone="muted" lines={1}>
              {track.artists.map((artist) => artist.name).join(', ')}
            </Words>
          </View>
        </Button>
      ))}
    </View>
  );
};

TheUpNext.displayName = 'TheUpNext';

export { TheUpNext };
