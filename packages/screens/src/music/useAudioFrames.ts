import { useCallback, useEffect, useState } from 'react';
import { analyserFor } from '@ValenceScreens/music/analyserFor';
import { makeAudioFrame } from '@ValenceScreens/music/visualisers/makeAudioFrame';
import type { AudioFrame } from '@ValenceScreens/music/visualisers/AudioFrame';

const SILENT_BINS = 512;

const SILENT_SAMPLES = 1024;

const SILENCE = 128;

/**
 * What a visualiser draws from, read fresh for each frame, for as long as somebody is looking.
 *
 * The sound is routed into an analyser only once this is switched on, and then only where the
 * browser will do it without harm — see `analyserFor`. Where it cannot, every frame is silence and
 * `isListening` says so, so the view can tell the viewer why nothing moves.
 *
 * @param element - The element playing the music, or nothing while there is none.
 * @param isOn - Whether anybody is looking at a visualiser, which is when to start listening.
 * @returns Whether the sound can be heard, and a reader that gathers the next frame.
 */
const useAudioFrames = (
  element: HTMLMediaElement | null,
  isOn: boolean,
): {
  isListening: boolean;
  read: (
    size: { width: number; height: number },
    time: { seconds: number; delta: number },
    hue: number,
  ) => AudioFrame;
} => {
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null);

  useEffect(() => {
    setAnalyser(isOn && element !== null ? analyserFor(element) : null);
  }, [element, isOn]);

  const read = useCallback(
    (
      size: { width: number; height: number },
      time: { seconds: number; delta: number },
      hue: number,
    ): AudioFrame => {
      if (analyser === null) {
        return makeAudioFrame(
          new Uint8Array(SILENT_BINS),
          new Uint8Array(SILENT_SAMPLES).fill(SILENCE),
          size,
          time,
          hue,
        );
      }

      const heard = new Uint8Array(analyser.frequencyBinCount);
      const wave = new Uint8Array(analyser.fftSize);

      analyser.getByteFrequencyData(heard);
      analyser.getByteTimeDomainData(wave);

      return makeAudioFrame(heard, wave, size, time, hue);
    },
    [analyser],
  );

  return { isListening: analyser !== null, read };
};

export { useAudioFrames };
