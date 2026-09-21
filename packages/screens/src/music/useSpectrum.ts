import { useCallback, useEffect, useState } from 'react';
import { analyserFor } from '@ValenceScreens/music/analyserFor';
import { spectrumBars } from '@ValenceScreens/music/spectrumBars';

/**
 * How loud each part of the sound is playing right now, for as long as somebody is looking.
 *
 * The sound is routed into an analyser only once this is switched on, and then only where the
 * browser will do it without harm — see `analyserFor`.
 *
 * @param element - The element playing the music, or nothing while there is none.
 * @param isOn - Whether anybody is looking at a visualiser, which is when to start listening.
 * @returns A reader that answers each bar's height, or nothing at all until there is something to hear.
 */
const useSpectrum = (
  element: HTMLMediaElement | null,
  isOn: boolean,
): ((bars: number) => readonly number[]) => {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    setAnalyser(isOn && element !== null ? analyserFor(element) : null);
  }, [element, isOn]);

  return useCallback(
    (bars: number) => {
      if (analyser === null) {
        return [];
      }

      const heard = new Uint8Array(analyser.frequencyBinCount);

      analyser.getByteFrequencyData(heard);

      return spectrumBars(heard, bars);
    },
    [analyser],
  );
};

export { useSpectrum };
