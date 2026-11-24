import { useEffect, useRef } from 'react';
import { z } from 'zod';
import { thePhonesVolume } from '@ValenceMobile/platform/thePhonesVolume';

const VolumeSchema = z.object({ volume: z.number() });

const MIDDLE = 0.5;

const NEAR = 0.01;

/**
 * Whether the phone's volume has gone as far as it goes one way or the other, where a press of its
 * buttons would change nothing and so could not be heard.
 *
 * @param volume - How loud the phone is.
 * @returns Whether it is at an end.
 */
const isAtAnEnd = (volume: number): boolean => volume <= NEAR || volume >= 1 - NEAR;

/**
 * Hears the buttons on the side of the phone as turning something else up or down — a television
 * this phone is the remote for — rather than the phone. Each press is told as how far it moved the
 * phone's volume; the phone is put back in the middle whenever it reaches an end, so a press is
 * still heard there, and back where it was once this stops listening.
 *
 * @param isOn - Whether to listen now.
 * @param onTurn - Told how far a press turned it, up or down.
 */
const useVolumeButtons = (isOn: boolean, onTurn: (by: number) => void): void => {
  const told = useRef(onTurn);

  useEffect(() => {
    told.current = onTurn;
  });

  useEffect(() => {
    const volume = thePhonesVolume;

    if (!isOn || volume === null) {
      return undefined;
    }

    const kept = volume.now();
    let last = kept;
    let settling: number | null = null;

    const putInTheMiddle = (): void => {
      settling = MIDDLE;
      last = MIDDLE;
      void volume.set(MIDDLE);
    };

    volume.hearTheButtons(true);

    if (isAtAnEnd(kept)) {
      putInTheMiddle();
    }

    const listening = volume.addListener('onVolume', (change) => {
      const read = VolumeSchema.safeParse(change);

      if (!read.success) {
        return;
      }

      const now = read.data.volume;

      if (settling !== null && Math.abs(now - settling) < NEAR) {
        settling = null;
        last = now;

        return;
      }

      const by = now - last;

      last = now;

      if (Math.abs(by) < NEAR) {
        return;
      }

      told.current(by);

      if (isAtAnEnd(now)) {
        putInTheMiddle();
      }
    });

    return () => {
      listening.remove();
      volume.hearTheButtons(false);
      void volume.set(kept);
    };
  }, [isOn]);
};

export { useVolumeButtons };
