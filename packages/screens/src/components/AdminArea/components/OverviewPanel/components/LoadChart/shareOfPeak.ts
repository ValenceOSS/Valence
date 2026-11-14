/**
 * Where a rate sits against the busiest rate shown, as a percentage, so a line with no ceiling of its
 * own can be drawn on a chart of percentages.
 *
 * @param rate - The rate, where it is known.
 * @param peak - The busiest rate shown.
 * @returns The rate as a share of the peak, nothing where the rate is unknown.
 */
const shareOfPeak = (rate: number | null | undefined, peak: number): number | null => {
  if (rate === undefined || rate === null) {
    return null;
  }

  return peak <= 0 ? 0 : Math.min(100, (rate / peak) * 100);
};

export { shareOfPeak };
