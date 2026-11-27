import { Volume, VolumeLow } from '@keyline-icons/react-native';
import { StyleSheet, View } from 'react-native';
import { Icon } from '@ValenceMobile/components/Icon/Icon';
import { Slider } from '@ValenceMobile/components/Slider/Slider';
import type { AVolumeRowProps } from './AVolumeRow.types';
import { say } from '@ValenceI18n/say';

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  slider: { flex: 1 },
});

/**
 * A volume, between a quiet speaker and a loud one as Apple Music draws it.
 *
 * @param level - How loud, from nothing to all the way up.
 * @param colour - The colour of the part behind the thumb.
 * @param quietColour - The colour of the speakers.
 * @param restColour - The colour of the part ahead of the thumb.
 * @param onTurning - Told how loud while it is being dragged.
 * @param onTurned - Told how loud where it was let go.
 */
const AVolumeRow = ({
  level,
  colour,
  quietColour,
  restColour,
  onTurning,
  onTurned,
}: AVolumeRowProps) => (
  <View style={styles.row}>
    <Icon of={VolumeLow} size={16} colour={quietColour} />
    <View style={styles.slider}>
      <Slider
        label={say('common.volume')}
        value={level}
        furthest={1}
        colour={colour}
        restColour={restColour}
        aheadColour={restColour}
        onScrubbing={onTurning}
        onScrubbed={onTurned}
      />
    </View>
    <Icon of={Volume} size={16} colour={quietColour} />
  </View>
);

AVolumeRow.displayName = 'AVolumeRow';

export { AVolumeRow };
