const CURVE = 3;

/**
 * How loud to play something for where its volume control sits, so the control moves in steps
 * that sound even.
 *
 * Hearing is logarithmic, so a control that set the gain directly spent its whole top half on
 * changes too small to notice and did all its work in the last sliver near silence. Raising the
 * position to the third power spreads roughly sixty decibels across the track, the curve music
 * players use, so halfway sounds about half as loud rather than nearly full.
 *
 * @param level - Where the control sits, from silent at nought to full at one.
 * @returns The gain to give the media element, from nought to one.
 */
const gainFor = (level: number): number => Math.min(Math.max(level, 0), 1) ** CURVE;

export { gainFor };
