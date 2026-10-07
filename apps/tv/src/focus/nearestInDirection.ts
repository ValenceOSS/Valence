import type { Box } from '@ValenceTv/focus/Box';
import type { Direction } from '@ValenceTv/focus/Direction';

const ACROSS_WEIGHT = 13;

/**
 * Whether one box lies wholly past another in a direction, so moving that way could land on it.
 *
 * @param from - Where the remote is.
 * @param to - Somewhere it might go.
 * @param direction - The way it is moving.
 * @returns Whether `to` is past `from` that way.
 */
const isPast = (from: Box, to: Box, direction: Direction): boolean => {
  switch (direction) {
    case 'right':
      return to.left >= from.right - 1;
    case 'left':
      return to.right <= from.left + 1;
    case 'down':
      return to.top >= from.bottom - 1;
    case 'up':
      return to.bottom <= from.top + 1;
  }
};

/**
 * Whether two boxes share some of the line the remote moves across, so one is level with the other:
 * the same height for left and right, the same width for up and down.
 *
 * @param from - Where the remote is.
 * @param to - Somewhere it might go.
 * @param direction - The way it is moving.
 * @returns Whether they overlap across the move.
 */
const isLevel = (from: Box, to: Box, direction: Direction): boolean =>
  direction === 'left' || direction === 'right'
    ? to.top < from.bottom && from.top < to.bottom
    : to.left < from.right && from.left < to.right;

/**
 * How far away a box is in a direction, the gap along the move weighing far more than the offset
 * across it, so the next thing in line beats something nearer but out of line.
 *
 * @param from - Where the remote is.
 * @param to - Somewhere it might go.
 * @param direction - The way it is moving.
 * @returns The distance, smaller for better.
 */
const distanceTo = (from: Box, to: Box, direction: Direction): number => {
  const along =
    direction === 'right'
      ? to.left - from.right
      : direction === 'left'
        ? from.left - to.right
        : direction === 'down'
          ? to.top - from.bottom
          : from.top - to.bottom;
  const across =
    direction === 'left' || direction === 'right'
      ? (to.top + to.bottom) / 2 - (from.top + from.bottom) / 2
      : (to.left + to.right) / 2 - (from.left + from.right) / 2;

  return ACROSS_WEIGHT * Math.max(along, 0) ** 2 + across ** 2;
};

/**
 * Where the remote goes from one place in a direction, among the places it could land, the way
 * tvOS's focus engine picks: only somewhere wholly past it that way, level with it before anything
 * that is not, and nearest of those.
 *
 * Left and right go only to something level, so the end of a row stays where it is rather than
 * jumping up or down to whatever lies furthest that way; up and down go to the nearest row past it
 * even where nothing in it lines up exactly.
 *
 * @param from - Where the remote is.
 * @param places - Where it could land, each with its box.
 * @param direction - The way it is moving.
 * @returns Where it goes, or nothing where nothing lies that way.
 */
const nearestInDirection = <Place>(
  from: Box,
  places: readonly { place: Place; box: Box }[],
  direction: Direction,
): Place | null => {
  const ahead = places.filter(({ box }) => isPast(from, box, direction));
  const level = ahead.filter(({ box }) => isLevel(from, box, direction));
  const sideways = direction === 'left' || direction === 'right';
  const choosing = level.length > 0 || sideways ? level : ahead;
  const [nearest] = [...choosing].sort(
    (one, other) => distanceTo(from, one.box, direction) - distanceTo(from, other.box, direction),
  );

  return nearest?.place ?? null;
};

export { nearestInDirection };
