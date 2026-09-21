type ElapsedPart = { value: number; unit: string; isFractional: boolean };

/**
 * Breaks how long something took into the numbers it is said in, each with its unit, in the largest
 * units that still say it plainly: 850 ms, 1.4 s, 12 s, 2 min 5 s, 1 h 3 min.
 *
 * The numbers are given apart from the words so that each can be drawn as a number that rolls to its
 * new value, and `describeElapsed` writes the same parts as text.
 *
 * @param ms - How long it took.
 * @returns The parts, largest first.
 */
const splitElapsed = (ms: number): ElapsedPart[] => {
  if (ms < 1000) {
    return [{ value: Math.round(ms), unit: 'ms', isFractional: false }];
  }

  const seconds = ms / 1000;

  if (seconds < 10) {
    return [{ value: Math.round(seconds * 10) / 10, unit: 's', isFractional: true }];
  }

  const whole = Math.round(seconds);

  if (whole < 60) {
    return [{ value: whole, unit: 's', isFractional: false }];
  }

  const minutes = Math.floor(whole / 60);

  if (minutes < 60) {
    const rest = whole % 60;

    return [
      { value: minutes, unit: 'min', isFractional: false },
      ...(rest === 0 ? [] : [{ value: rest, unit: 's', isFractional: false }]),
    ];
  }

  const rest = minutes % 60;

  return [
    { value: Math.floor(minutes / 60), unit: 'h', isFractional: false },
    ...(rest === 0 ? [] : [{ value: rest, unit: 'min', isFractional: false }]),
  ];
};

export type { ElapsedPart };

export { splitElapsed };
