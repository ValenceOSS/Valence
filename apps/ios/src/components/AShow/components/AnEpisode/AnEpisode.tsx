import { StyleSheet, View } from 'react-native';
import { Info } from 'lucide-react-native';
import { Button } from '@ValencePhone/components/Button/Button';
import { HowFar } from '@ValencePhone/components/HowFar/HowFar';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Words } from '@ValencePhone/components/Words/Words';
import { howLongItRuns } from '@ValencePhone/components/ATitle/howLongItRuns';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import type { AnEpisodeProps } from './AnEpisode.types';

const WATCHED_ENOUGH = 0.95;

const styles = StyleSheet.create({
  about: { padding: 10 },
  facts: { flex: 1, gap: 3 },
  number: { minWidth: 28 },
  play: { flex: 1 },
  row: { alignItems: 'center', flexDirection: 'row', gap: 12, paddingVertical: 12 },
  whole: { alignItems: 'center', flexDirection: 'row' },
});

/**
 * One episode in a programme's list: its number, its title, how long it runs and how much of it
 * has been seen. Pressing it plays it; the button beside it opens its own page.
 *
 * @param episode - The episode.
 * @param watched - How much of it has been seen, as a fraction.
 * @param airs - When it aired, where the catalogue says.
 * @param onWatch - Told to play it.
 * @param onLookAt - Told to open its page.
 */
const AnEpisode = ({ episode, watched, airs, onWatch, onLookAt }: AnEpisodeProps) => {
  const colours = useTheColours();
  const isDone = watched >= WATCHED_ENOUGH;

  return (
    <View style={styles.whole}>
      <View style={styles.play}>
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
                {[howLongItRuns(episode.durationSeconds), airs === '' ? null : airs]
                  .filter((part) => part !== null)
                  .join(' · ')}
              </Words>

              {watched > 0 && !isDone ? (
                <HowFar fraction={watched} label={`How far through ${episode.title}`} />
              ) : null}
            </View>
          </View>
        </Button>
      </View>

      <Button tone="bare" label={`About ${episode.title}`} onPress={onLookAt}>
        <View style={styles.about}>
          <Icon of={Info} size={20} colour={colours.textMuted} />
        </View>
      </Button>
    </View>
  );
};

AnEpisode.displayName = 'AnEpisode';

export { AnEpisode };
