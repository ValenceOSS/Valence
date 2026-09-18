import { describe, expect, it } from 'vitest';
import {
  addToQueue,
  currentOf,
  cycleRepeat,
  jumpTo,
  nextIn,
  playNext,
  previousIn,
  removeFromQueue,
  startQueue,
  toggleShuffle,
  upcomingIn,
} from './playQueue';
import type { MusicTrack } from '@ValenceContracts/schemas/Music';

const track = (n: number): MusicTrack => ({
  id: `00000000-0000-4000-8000-${n.toString().padStart(12, '0')}`,
  libraryId: '00000000-0000-4000-8000-00000000f1f1',
  title: `Track ${n.toString()}`,
  artists: [],
  album: { id: '00000000-0000-4000-8000-00000000a1b1', title: 'Album', hasArtwork: false },
  discNumber: null,
  trackNumber: n,
  durationSeconds: 200,
  codec: 'flac',
  isLossless: true,
  isExplicit: false,
  bitDepth: 16,
  sampleRate: 44_100,
  bitrateKbps: 900,
  hasLyrics: false,
  videoKey: null,
  isFavourite: false,
});

const FIVE = [1, 2, 3, 4, 5].map(track);

const titleOf = (queue: ReturnType<typeof startQueue> | null) =>
  queue === null ? null : (currentOf(queue)?.title ?? null);

/**
 * Deterministic randomness, so a shuffle can be read back.
 *
 * @returns The next number in a fixed run.
 */
const steady = () => 0.3;

describe('playQueue', () => {
  it('starts on the track that was pressed', () => {
    expect(titleOf(startQueue(FIVE, 2))).toBe('Track 3');
  });

  it('plays on in order', () => {
    expect(titleOf(nextIn(startQueue(FIVE, 0), false))).toBe('Track 2');
  });

  it('stops after the last track', () => {
    expect(nextIn(startQueue(FIVE, 4), false)).toBeNull();
  });

  it('goes round again where it is set to repeat everything', () => {
    expect(titleOf(nextIn(startQueue(FIVE, 4, { repeat: 'all' }), false))).toBe('Track 1');
  });

  it('plays one song again where it is set to repeat it, but still skips on a press', () => {
    const queue = startQueue(FIVE, 1, { repeat: 'one' });

    expect(titleOf(nextIn(queue, false))).toBe('Track 2');
    expect(titleOf(nextIn(queue, true))).toBe('Track 3');
  });

  it('goes back one track, and no further than the first', () => {
    expect(titleOf(previousIn(startQueue(FIVE, 2)))).toBe('Track 2');
    expect(titleOf(previousIn(startQueue(FIVE, 0)))).toBe('Track 1');
  });

  it('goes back round to the end where everything repeats', () => {
    expect(titleOf(previousIn(startQueue(FIVE, 0, { repeat: 'all' })))).toBe('Track 5');
  });

  it('shuffles around the song playing without interrupting it', () => {
    const queue = toggleShuffle(startQueue(FIVE, 2), steady);

    expect(queue.isShuffled).toBe(true);
    expect(titleOf(queue)).toBe('Track 3');
    expect([...queue.order].sort()).toEqual([0, 1, 2, 3, 4]);
  });

  it('goes back to the chosen order when shuffle is switched off, on the same song', () => {
    const shuffled = toggleShuffle(startQueue(FIVE, 2), steady);
    const moved = nextIn(shuffled, true);
    const playing = titleOf(moved);
    const straight = toggleShuffle(moved ?? shuffled);

    expect(straight.order).toEqual([0, 1, 2, 3, 4]);
    expect(titleOf(straight)).toBe(playing);
  });

  it('starts shuffled where asked, still on the pressed track', () => {
    const queue = startQueue(FIVE, 3, { isShuffled: true, random: steady });

    expect(titleOf(queue)).toBe('Track 4');
    expect(queue.at).toBe(0);
  });

  it('goes round the repeat settings', () => {
    const queue = startQueue(FIVE, 0);

    expect(cycleRepeat(queue).repeat).toBe('all');
    expect(cycleRepeat(cycleRepeat(queue)).repeat).toBe('one');
    expect(cycleRepeat(cycleRepeat(cycleRepeat(queue))).repeat).toBe('off');
  });

  describe('a queue whose order means something', () => {
    it('will not shuffle, however it was asked to start', () => {
      const queue = startQueue(FIVE, 0, { isOrdered: true, isShuffled: true });

      expect(queue.isShuffled).toBe(false);
      expect(toggleShuffle(queue).isShuffled).toBe(false);
    });

    it('will not repeat', () => {
      const queue = startQueue(FIVE, 0, { isOrdered: true, repeat: 'all' });

      expect(queue.repeat).toBe('off');
      expect(cycleRepeat(queue).repeat).toBe('off');
    });
  });

  it('puts "play next" straight after the song playing', () => {
    const queue = playNext(startQueue(FIVE, 1), [track(9)]);

    expect(titleOf(nextIn(queue, true))).toBe('Track 9');
    expect(titleOf(nextIn(nextIn(queue, true) ?? queue, true))).toBe('Track 3');
  });

  it('adds to the end of the queue', () => {
    const queue = addToQueue(startQueue(FIVE, 4), [track(9)]);

    expect(titleOf(nextIn(queue, false))).toBe('Track 9');
  });

  it('jumps to a track further on', () => {
    expect(titleOf(jumpTo(startQueue(FIVE, 0), 3))).toBe('Track 4');
    expect(titleOf(jumpTo(startQueue(FIVE, 0), 9))).toBe('Track 1');
  });

  it('takes out a track still to come, keeping the song playing', () => {
    const queue = removeFromQueue(startQueue(FIVE, 2), 3);

    expect(titleOf(queue)).toBe('Track 3');
    expect(upcomingIn(queue).map((entry) => entry.track.title)).toEqual(['Track 5']);
  });

  it('keeps its place when a track already played is taken out', () => {
    expect(titleOf(removeFromQueue(startQueue(FIVE, 2), 0))).toBe('Track 3');
  });

  it('will not take out the song playing', () => {
    expect(removeFromQueue(startQueue(FIVE, 2), 2).order).toHaveLength(5);
  });

  it('lists what is still to come, with where each sits in the order', () => {
    expect(upcomingIn(startQueue(FIVE, 3))).toEqual([{ at: 4, track: FIVE[4] }]);
  });

  it('has nothing playing when there is nothing in it', () => {
    const queue = startQueue([], 0);

    expect(currentOf(queue)).toBeNull();
    expect(nextIn(queue, true)).toBeNull();
  });
});
