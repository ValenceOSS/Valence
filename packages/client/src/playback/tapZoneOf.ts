type TapZone = 'back' | 'middle' | 'forward';

/**
 * Which part of the picture a tap landed in: the left edge goes back, the right edge goes forward,
 * and anywhere between is the middle, which plays and pauses.
 *
 * @param across - How far across the picture the tap was, from 0 at the left to 1 at the right.
 * @param edge - How much of each side counts as its edge, as a share of the width.
 * @returns The part of the picture tapped.
 */
const tapZoneOf = (across: number, edge: number): TapZone =>
  across <= edge ? 'back' : across >= 1 - edge ? 'forward' : 'middle';

export type { TapZone };

export { tapZoneOf };
