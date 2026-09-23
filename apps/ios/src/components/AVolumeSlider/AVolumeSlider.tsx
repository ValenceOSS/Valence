import { Volume, VolumeLow } from '@keyline-icons/react-native';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { requireNativeView, requireOptionalNativeModule } from 'expo';
import { z } from 'zod';
import { Icon } from '@ValencePhone/components/Icon/Icon';
import { Slider } from '@ValencePhone/components/Slider/Slider';
import { useTheColours } from '@ValencePhone/theme/useTheColours';
import { withAlpha } from '@ValencePhone/theme/withAlpha';
import type { NativeVolumeProps, VolumeModule } from './AVolumeSlider.types';

const TheSystemSlider = requireNativeView<NativeVolumeProps>('ValenceVolume');

const volumeControl = requireOptionalNativeModule<VolumeModule>('ValenceVolume');

const VolumeSchema = z.object({ volume: z.number() });

const OUT_OF_SIGHT = { height: 1, left: 0, position: 'absolute', top: 0, width: 1 } as const;

const styles = StyleSheet.create({
  row: { alignItems: 'center', flexDirection: 'row', gap: 10 },
  slider: { flex: 1 },
});

/**
 * The phone's volume, between a quiet speaker and a loud one as Apple Music draws it, on the same
 * line as the song's progress above it. It follows the buttons on the side of the phone and sets
 * the volume of whichever speaker is playing, AirPlay ones included.
 */
const AVolumeSlider = () => {
  const colours = useTheColours();
  const [volume, setVolume] = useState(() => volumeControl?.now() ?? 1);

  useEffect(() => {
    if (volumeControl === null) {
      return undefined;
    }

    const listening = volumeControl.addListener('onVolume', (change) => {
      const read = VolumeSchema.safeParse(change);

      if (read.success) {
        setVolume(read.data.volume);
      }
    });

    return () => {
      listening.remove();
    };
  }, []);

  /**
   * Sets the phone's volume, and shows it set before the phone says so.
   *
   * @param to - How loud, from nothing to everything.
   */
  const turnTo = (to: number) => {
    setVolume(to);
    void volumeControl?.set(to);
  };

  return (
    <View style={styles.row}>
      <TheSystemSlider style={OUT_OF_SIGHT} />
      <Icon of={VolumeLow} size={16} colour={colours.textMuted} />
      <View style={styles.slider}>
        <Slider
          label="Volume"
          value={volume}
          furthest={1}
          colour={colours.text}
          restColour={withAlpha(colours.text, 0.2)}
          aheadColour={withAlpha(colours.text, 0.2)}
          onScrubbing={turnTo}
          onScrubbed={turnTo}
        />
      </View>
      <Icon of={Volume} size={16} colour={colours.textMuted} />
    </View>
  );
};

AVolumeSlider.displayName = 'AVolumeSlider';

export { AVolumeSlider };
