import { useEffect, useState } from 'react';
import { z } from 'zod';
import { AVolumeRow } from '@ValenceMobile/components/AVolumeRow/AVolumeRow';
import { TheSystemVolume } from '@ValenceMobile/components/TheSystemVolume/TheSystemVolume';
import { thePhonesVolume } from '@ValenceMobile/platform/thePhonesVolume';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { withAlpha } from '@ValenceCore/functions/withAlpha';

const VolumeSchema = z.object({ volume: z.number() });

/**
 * The phone's volume, between a quiet speaker and a loud one as Apple Music draws it, on the same
 * line as the song's progress above it. It follows the buttons on the side of the phone and sets
 * the volume of whichever speaker is playing, AirPlay ones included.
 */
const AVolumeSlider = () => {
  const colours = useTheColours();
  const [volume, setVolume] = useState(() => thePhonesVolume?.now() ?? 1);

  useEffect(() => {
    if (thePhonesVolume === null) {
      return undefined;
    }

    const listening = thePhonesVolume.addListener('onVolume', (change) => {
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
    void thePhonesVolume?.set(to);
  };

  return (
    <>
      <TheSystemVolume />
      <AVolumeRow
        level={volume}
        colour={colours.text}
        quietColour={colours.textMuted}
        restColour={withAlpha(colours.text, 0.2)}
        onTurning={turnTo}
        onTurned={turnTo}
      />
    </>
  );
};

AVolumeSlider.displayName = 'AVolumeSlider';

export { AVolumeSlider };
