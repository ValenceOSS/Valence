const AUDIBLE_SHARE = 0.72;

const CURVE = 1.6;

/**
 * Folds what an analyser heard, a strip of loudness across the frequencies, into a fixed number of
 * bars, leaving out the top of the range where music has almost nothing to show.
 *
 * @param heard - The loudness at each frequency, from silence to 255.
 * @param bars - How many bars to make of it.
 * @returns Each bar's height from nothing to one, quieter parts pulled down so the loud ones stand out.
 */
const spectrumBars = (heard: Uint8Array, bars: number): number[] => {
  const usable = Math.max(1, Math.floor(heard.length * AUDIBLE_SHARE));

  return Array.from({ length: bars }, (_, bar) => {
    const from = Math.floor((bar / bars) * usable);
    const to = Math.max(from + 1, Math.floor(((bar + 1) / bars) * usable));

    let total = 0;

    for (let at = from; at < to; at += 1) {
      total += heard[at] ?? 0;
    }

    return (total / (to - from) / 255) ** CURVE;
  });
};

export { spectrumBars };
