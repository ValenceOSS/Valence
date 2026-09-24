import { StyleSheet, View } from 'react-native';
import { Slider } from '@ValencePhone/components/Slider/Slider';
import { useWhereTheSongIs } from '@ValencePhone/components/TheMusicPlayer/useWhereTheSongIs';
import { Words } from '@ValencePhone/components/Words/Words';
import { asAClock } from '@ValencePhone/components/Watching/asAClock';
import { useTheMusic } from '@ValencePhone/hooks/useTheMusic';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { withAlpha } from '@ValencePhone/theme/withAlpha';
import type { ThePlaceInTheSongProps } from './ThePlaceInTheSong.types';

const styles = StyleSheet.create({
  lasts: { alignItems: 'flex-end' },
  time: { flex: 1 },
  times: { alignItems: 'center', flexDirection: 'row' },
});

/**
 * Where the song has got to, as a bar to scrub through and the time gone and the time left beneath
 * it, drawn again as the song moves without drawing the rest of the player again.
 *
 * @param title - The song's name, for the bar's label.
 * @param children - What sits between the two times.
 */
const ThePlaceInTheSong = ({ title, children }: ThePlaceInTheSongProps) => {
  const colours = useTheColours();
  const { player, state } = useTheMusic();
  const position = useWhereTheSongIs();

  return (
    <View>
      <Slider
        label={`Move through ${title}`}
        value={position}
        furthest={state.durationSeconds}
        colour={colours.text}
        restColour={withAlpha(colours.text, 0.2)}
        aheadColour={withAlpha(colours.text, 0.35)}
        onScrubbed={(to) => {
          player.seek(to);
        }}
      />
      <View style={styles.times}>
        <View style={styles.time}>
          <Words size="small" tone="muted">
            {asAClock(position)}
          </Words>
        </View>
        {children}
        <View style={[styles.time, styles.lasts]}>
          <Words size="small" tone="muted">
            {`−${asAClock(Math.max(state.durationSeconds - position, 0))}`}
          </Words>
        </View>
      </View>
    </View>
  );
};

ThePlaceInTheSong.displayName = 'ThePlaceInTheSong';

export { ThePlaceInTheSong };
