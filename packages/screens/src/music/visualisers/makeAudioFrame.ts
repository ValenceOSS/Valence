import { spectrumBars } from '@ValenceScreens/music/spectrumBars';
import type { AudioFrame } from './AudioFrame';

const BASS_SHARE = 0.08;

const MID_SHARE = 0.4;

const SILENCE = 128;

/**
 * The loudness of one part of the range, from its lowest bar to its highest.
 *
 * @param bars - The spectrum, folded into bars.
 * @param from - Where the part starts, as a share of the bars.
 * @param to - Where it ends.
 * @returns How loud it is, from nothing to one.
 */
const loudnessOf = (bars: readonly number[], from: number, to: number): number => {
  const first = Math.floor(bars.length * from);
  const last = Math.max(first + 1, Math.floor(bars.length * to));
  const part = bars.slice(first, last);

  return part.reduce((sum, bar) => sum + bar, 0) / part.length;
};

/**
 * Gathers what a visualiser draws from into one frame: how big the screen is, how long it has been
 * running and since the last frame, and what the sound is doing — how much bass, middle and treble,
 * the spectrum in as many bars as are asked for, and the wave itself.
 *
 * @param heard - The loudness at each frequency, from silence to 255.
 * @param wave - The sound's wave, from 0 to 255 around a silence at 128.
 * @param size - How big the screen is.
 * @param time - How long the visualiser has run, and since the last frame, in seconds.
 * @param hue - The colour the visualiser leans toward, in degrees.
 * @returns The frame.
 */
const makeAudioFrame = (
  heard: Uint8Array,
  wave: Uint8Array,
  size: { width: number; height: number },
  time: { seconds: number; delta: number },
  hue: number,
): AudioFrame => {
  const overall = spectrumBars(heard, 32);

  return {
    ...size,
    ...time,
    hue,
    bass: loudnessOf(overall, 0, BASS_SHARE),
    mid: loudnessOf(overall, BASS_SHARE, MID_SHARE),
    treble: loudnessOf(overall, MID_SHARE, 1),
    spectrum: (bars) => spectrumBars(heard, bars),
    wave: (points) =>
      Array.from({ length: points }, (_, point) => {
        const at = Math.min(wave.length - 1, Math.floor((point / points) * wave.length));

        return ((wave[at] ?? SILENCE) - SILENCE) / SILENCE;
      }),
  };
};

export { makeAudioFrame };
