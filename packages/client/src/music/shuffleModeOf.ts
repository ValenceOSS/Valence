import type { PlayQueue } from '@ValenceClient/music/playQueue';

/**
 * Which of the three shuffle settings a queue is on, for a shuffle button to draw.
 *
 * @param queue - The queue, where there is one.
 * @returns Off, shuffled, or smart shuffle.
 */
const shuffleModeOf = (queue: PlayQueue | null): 'off' | 'on' | 'smart' =>
  queue === null || !queue.isShuffled ? 'off' : queue.isSmart ? 'smart' : 'on';

export { shuffleModeOf };
