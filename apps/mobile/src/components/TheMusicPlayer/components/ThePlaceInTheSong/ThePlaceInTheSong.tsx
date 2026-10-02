import { StyleSheet, View } from 'react-native';
import { Slider } from '@ValenceMobile/components/Slider/Slider';
import { useWhereTheSongIs } from '@ValenceMobile/components/TheMusicPlayer/useWhereTheSongIs';
import { Words } from '@ValenceMobile/components/Words/Words';
import { asAClock } from '@ValenceMobile/components/Watching/asAClock';
import { useTheMusic } from '@ValenceMobile/hooks/useTheMusic';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceMobile/theme/withAlpha';
import type { ThePlaceInTheSongProps } from './ThePlaceInTheSong.types';
import { say } from '@ValenceI18n/say';

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
 * @param onSeek - Told where they scrubbed to.
 * @param isFixed - Whether the song is somebody else's to move, as a listening party's host's is.
 * @param children - What sits between the two times.
 */
const ThePlaceInTheSong = ({
  title,
  onSeek,
  isFixed = false,
  children,
}: ThePlaceInTheSongProps) => {
  const colours = useTheColours();
  const { state } = useTheMusic();
  const position = useWhereTheSongIs();

  return (
    <View>
      <Slider
        label={say('common.moveThroughTitle', { title })}
        value={position}
        furthest={state.durationSeconds}
        colour={colours.text}
        restColour={withAlpha(colours.text, 0.2)}
        aheadColour={withAlpha(colours.text, 0.35)}
        onScrubbed={onSeek}
        isDisabled={isFixed}
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
