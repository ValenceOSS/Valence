import type { MusicTrack } from '@ValenceContracts/schemas/Music';

type RepeatMode = 'off' | 'all' | 'one';

type QueueSource = {
  kind: 'album' | 'artist' | 'playlist' | 'liked' | 'search' | 'tracks';
  id: string | null;
  name: string;
};

type PlayQueue = {
  tracks: MusicTrack[];
  order: number[];
  at: number;
  isShuffled: boolean;
  repeat: RepeatMode;
  isOrdered: boolean;
  source: QueueSource | null;
};

type StartOptions = {
  isOrdered?: boolean;
  isShuffled?: boolean;
  repeat?: RepeatMode;
  source?: QueueSource | null;
  random?: () => number;
};

/**
 * Deals the rest of a queue into a random order around the track already playing, which stays
 * where it is so switching shuffle on never interrupts the song.
 *
 * @param length - How many tracks there are.
 * @param first - The one playing, which is dealt first.
 * @param random - Where the randomness comes from.
 * @returns The order to play them in.
 */
const shuffledOrder = (length: number, first: number, random: () => number): number[] => {
  const rest = Array.from({ length }, (_, index) => index).filter((index) => index !== first);

  for (let index = rest.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(random() * (index + 1));
    const held = rest[index];
    const other = rest[swap];

    if (held !== undefined && other !== undefined) {
      rest[index] = other;
      rest[swap] = held;
    }
  }

  return length === 0 ? [] : [first, ...rest];
};

/**
 * Fills a queue from what somebody chose to play, starting at the track they pressed.
 *
 * A queue whose order means something — an audiobook's chapters, a series in release order — never
 * shuffles and never repeats, however it was asked to, since chapter three after chapter seven is
 * a bug rather than a feature.
 *
 * @param tracks - What to play.
 * @param startAt - Which of them was pressed.
 * @param options - Whether the order means something, shuffle, repeat, and where it came from.
 * @returns The queue.
 */
const startQueue = (
  tracks: readonly MusicTrack[],
  startAt: number,
  options: StartOptions = {},
): PlayQueue => {
  const isOrdered = options.isOrdered ?? false;
  const first = Math.min(Math.max(startAt, 0), Math.max(tracks.length - 1, 0));
  const isShuffled = !isOrdered && (options.isShuffled ?? false);
  const straight = Array.from({ length: tracks.length }, (_, index) => index);

  return {
    tracks: [...tracks],
    order: isShuffled
      ? shuffledOrder(tracks.length, first, options.random ?? Math.random)
      : straight,
    at: isShuffled ? 0 : first,
    isShuffled,
    repeat: isOrdered ? 'off' : (options.repeat ?? 'off'),
    isOrdered,
    source: options.source ?? null,
  };
};

/**
 * The track the queue is on.
 *
 * @param queue - The queue.
 * @returns The track, or nothing where the queue is empty.
 */
const currentOf = (queue: PlayQueue): MusicTrack | null =>
  queue.tracks[queue.order[queue.at] ?? -1] ?? null;

/**
 * Moves the queue on, either because a song ended or because somebody skipped it.
 *
 * Repeating one song repeats it when it ends, but a skip still skips. Past the last track, a queue
 * set to repeat everything goes round again and any other stops.
 *
 * @param queue - The queue.
 * @param isSkip - Whether somebody pressed next, rather than the song ending.
 * @returns The queue moved on, or nothing where it has finished.
 */
const nextIn = (queue: PlayQueue, isSkip: boolean): PlayQueue | null => {
  if (queue.order.length === 0) {
    return null;
  }

  if (queue.repeat === 'one' && !isSkip) {
    return queue;
  }

  if (queue.at + 1 < queue.order.length) {
    return { ...queue, at: queue.at + 1 };
  }

  return queue.repeat === 'off' ? null : { ...queue, at: 0 };
};

/**
 * Moves the queue back one track, going round to the end where it is set to repeat.
 *
 * @param queue - The queue.
 * @returns The queue moved back.
 */
const previousIn = (queue: PlayQueue): PlayQueue => {
  if (queue.at > 0) {
    return { ...queue, at: queue.at - 1 };
  }

  return queue.repeat === 'all' ? { ...queue, at: Math.max(queue.order.length - 1, 0) } : queue;
};

/**
 * Plays a different track of the queue, by where it sits in the order being played.
 *
 * @param queue - The queue.
 * @param at - Where in the play order to go.
 * @returns The queue on that track.
 */
const jumpTo = (queue: PlayQueue, at: number): PlayQueue =>
  at < 0 || at >= queue.order.length ? queue : { ...queue, at };

/**
 * Switches shuffle on or off without interrupting the song playing: on deals the rest around it,
 * off goes back to the order things were chosen in, still on the same song.
 *
 * @param queue - The queue.
 * @param random - Where the randomness comes from.
 * @returns The queue, unchanged where its order means something.
 */
const toggleShuffle = (queue: PlayQueue, random: () => number = Math.random): PlayQueue => {
  if (queue.isOrdered || queue.order.length === 0) {
    return queue;
  }

  const playing = queue.order[queue.at] ?? 0;

  return queue.isShuffled
    ? {
        ...queue,
        isShuffled: false,
        order: Array.from({ length: queue.tracks.length }, (_, index) => index),
        at: playing,
      }
    : {
        ...queue,
        isShuffled: true,
        order: shuffledOrder(queue.tracks.length, playing, random),
        at: 0,
      };
};

/**
 * Goes round the repeat settings: off, then everything, then the one song.
 *
 * @param queue - The queue.
 * @returns The queue, unchanged where its order means something.
 */
const cycleRepeat = (queue: PlayQueue): PlayQueue => {
  if (queue.isOrdered) {
    return queue;
  }

  const next: Record<RepeatMode, RepeatMode> = { off: 'all', all: 'one', one: 'off' };

  return { ...queue, repeat: next[queue.repeat] };
};

/**
 * Puts tracks straight after the one playing, the way "play next" does.
 *
 * @param queue - The queue.
 * @param tracks - What to play next.
 * @returns The queue with them in.
 */
const playNext = (queue: PlayQueue, tracks: readonly MusicTrack[]): PlayQueue => {
  const from = queue.tracks.length;
  const added = tracks.map((_, index) => from + index);

  return {
    ...queue,
    tracks: [...queue.tracks, ...tracks],
    order: [...queue.order.slice(0, queue.at + 1), ...added, ...queue.order.slice(queue.at + 1)],
  };
};

/**
 * Puts tracks at the end of the queue.
 *
 * @param queue - The queue.
 * @param tracks - What to add.
 * @returns The queue with them in.
 */
const addToQueue = (queue: PlayQueue, tracks: readonly MusicTrack[]): PlayQueue => {
  const from = queue.tracks.length;

  return {
    ...queue,
    tracks: [...queue.tracks, ...tracks],
    order: [...queue.order, ...tracks.map((_, index) => from + index)],
  };
};

/**
 * Takes a track that has not played yet out of the queue.
 *
 * @param queue - The queue.
 * @param at - Where in the play order it is.
 * @returns The queue without it, unchanged where that is the song playing.
 */
const removeFromQueue = (queue: PlayQueue, at: number): PlayQueue => {
  if (at === queue.at || at < 0 || at >= queue.order.length) {
    return queue;
  }

  return {
    ...queue,
    order: queue.order.filter((_, index) => index !== at),
    at: at < queue.at ? queue.at - 1 : queue.at,
  };
};

/**
 * Moves a song that is still to come to another place among those still to come.
 *
 * @param queue - The queue.
 * @param from - Where the song is in the play order.
 * @param to - Where it should be in the play order.
 * @returns The queue with it moved, unchanged where either place is not still to come.
 */
const moveInQueue = (queue: PlayQueue, from: number, to: number): PlayQueue => {
  const last = queue.order.length - 1;

  if (from === to || from <= queue.at || to <= queue.at || from > last || to > last) {
    return queue;
  }

  const order = [...queue.order];
  const [moved] = order.splice(from, 1);

  if (moved === undefined) {
    return queue;
  }

  order.splice(to, 0, moved);

  return { ...queue, order };
};

/**
 * What is still to come after the song playing, in the order it will play.
 *
 * @param queue - The queue.
 * @returns The tracks, each with where it sits in the play order.
 */
const upcomingIn = (queue: PlayQueue): { at: number; track: MusicTrack }[] =>
  queue.order.slice(queue.at + 1).flatMap((index, offset) => {
    const track = queue.tracks[index];

    return track === undefined ? [] : [{ at: queue.at + 1 + offset, track }];
  });

export type { PlayQueue, QueueSource, RepeatMode, StartOptions };

export {
  addToQueue,
  currentOf,
  cycleRepeat,
  jumpTo,
  moveInQueue,
  nextIn,
  playNext,
  previousIn,
  removeFromQueue,
  startQueue,
  toggleShuffle,
  upcomingIn,
};
