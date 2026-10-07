import type { Direction } from '@ValenceTv/focus/Direction';

const DIRECTIONS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/**
 * Which way a key moves the remote, for the arrow keys every television's browser sends for its
 * remote's pad.
 *
 * @param key - The key, as the browser names it.
 * @returns The direction, or nothing for any other key.
 */
const directionOfKey = (key: string): Direction | null => DIRECTIONS[key] ?? null;

export { directionOfKey };
