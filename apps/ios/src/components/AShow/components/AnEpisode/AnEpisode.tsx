import { StyleSheet, View } from 'react-native';
import { Button } from '@ValencePhone/components/Button/Button';
import { Words } from '@ValencePhone/components/Words/Words';
import { howLongItRuns } from '@ValencePhone/components/ATitle/howLongItRuns';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { AnEpisodeProps } from './AnEpisode.types';

const WATCHED_ENOUGH = 0.95;

const styles = StyleSheet.create({
  facts: { flex: 1, gap: 3 },
  howFar: { borderRadius: 2, flexDirection: 'row', height: 3, marginTop: 4, overflow: 'hidden' },
  number: { minWidth: 28 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 12 },
});

/**
 * One episode, as a line in a season rather than as a poster.
 *
 * Episodes are read in order and chosen by where somebody is up to, which is a list's job, not a
 * wall's. The number comes first because it is what people look for; the name and the length
 * follow, and a line underneath says how far through it they got.
 *
 * One press plays it. Somebody opening a programme has already decided what they are watching,
 * and a page in between asking whether they are sure is a page in the way.
 *
 * @param episode - The episode.
 * @param watched - How much of it they have seen, as a fraction.
 * @param onWatch - Told to play it.
 */
const AnEpisode = ({ episode, watched, onWatch }: AnEpisodeProps) => {
  const colours = useTheColours();
  const isDone = watched >= WATCHED_ENOUGH;

  return (
    <Button tone="bare" label={episode.title} onPress={onWatch}>
      <View style={styles.row}>
        <View style={styles.number}>
          <Words tone="muted">{episode.episodeNumber ?? '·'}</Words>
        </View>

        <View style={styles.facts}>
          <Words lines={2} tone={isDone ? 'muted' : 'plain'}>
            {episode.title}
          </Words>
          <Words size="small" tone="muted">
            {howLongItRuns(episode.durationSeconds)}
          </Words>

          {watched > 0 && !isDone ? (
            <View style={[styles.howFar, { backgroundColor: colours.border }]}>
              <View style={{ backgroundColor: colours.accent, flex: watched }} />
              <View style={{ flex: 1 - watched }} />
            </View>
          ) : null}
        </View>
      </View>
    </Button>
  );
};

AnEpisode.displayName = 'AnEpisode';

export { AnEpisode };
