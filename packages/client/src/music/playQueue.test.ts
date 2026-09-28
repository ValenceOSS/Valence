import { describe, expect, it } from 'vitest';
import {
  addToQueue,
  currentOf,
  cycleRepeat,
  cycleShuffle,
  jumpTo,
  clearUpNext,
  moveInQueue,
  nextIn,
  playNext,
  previousIn,
  removeFromQueue,
  startQueue,
  toggleShuffle,
  upcomingIn,
  weavePicks,
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

  it('moves a track still to come to another place among those to come', () => {
    const queue = moveInQueue(startQueue(FIVE, 0), 4, 1);

    expect(titleOf(queue)).toBe('Track 1');
    expect(upcomingIn(queue).map((entry) => entry.track.title)).toEqual([
      'Track 5',
      'Track 2',
      'Track 3',
      'Track 4',
    ]);
  });

  it('will not move the song playing or anything already played', () => {
    const queue = startQueue(FIVE, 2);

    expect(moveInQueue(queue, 2, 4)).toBe(queue);
    expect(moveInQueue(queue, 0, 4)).toBe(queue);
    expect(moveInQueue(queue, 4, 1)).toBe(queue);
  });

  it('leaves the queue as it was for a move to the same place or off the end', () => {
    const queue = startQueue(FIVE, 0);

    expect(moveInQueue(queue, 3, 3)).toBe(queue);
    expect(moveInQueue(queue, 3, 9)).toBe(queue);
  });

  it('lets go of everything still to come, keeping what played and the song playing', () => {
    const queue = clearUpNext(startQueue(FIVE, 2));

    expect(titleOf(queue)).toBe('Track 3');
    expect(queue.order).toEqual([0, 1, 2]);
    expect(upcomingIn(queue)).toEqual([]);
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

describe('smart shuffle', () => {
  const EXTRA = [6, 7, 8].map(track);

  const smart = () => cycleShuffle(cycleShuffle(startQueue(FIVE, 0), steady), steady);

  it('goes round off, shuffled, smart and off again', () => {
    const shuffled = cycleShuffle(startQueue(FIVE, 0), steady);

    expect(shuffled.isShuffled).toBe(true);
    expect(shuffled.isSmart).toBe(false);
    expect(smart().isSmart).toBe(true);

    const off = cycleShuffle(smart());

    expect(off.isShuffled).toBe(false);
    expect(off.isSmart).toBe(false);
  });

  it('never shuffles a queue whose order means something, or one with nothing in it', () => {
    const ordered = startQueue(FIVE, 0, { isOrdered: true });

    expect(cycleShuffle(ordered)).toBe(ordered);

    const empty = startQueue([], 0);

    expect(cycleShuffle(empty)).toBe(empty);
  });

  it('mixes songs into what is still to come, one after every few chosen ones', () => {
    const woven = weavePicks(smart(), EXTRA, 2);

    expect(woven.picks).toEqual(EXTRA.slice(0, 2).map((pick) => pick.id));
    expect(woven.tracks).toHaveLength(7);
    expect(woven.order.slice(woven.at + 1)).toHaveLength(6);
  });

  it('does not mix in a song already in the queue', () => {
    expect(weavePicks(smart(), [track(1)], 2).picks).toEqual([]);
  });

  it('mixes nothing in once smart shuffle has been switched off', () => {
    const shuffled = cycleShuffle(startQueue(FIVE, 0), steady);

    expect(weavePicks(shuffled, EXTRA)).toBe(shuffled);
  });

  it('lets go of the mixed-in songs still to come when switched off, keeping the chosen ones', () => {
    const off = cycleShuffle(weavePicks(smart(), EXTRA, 2));

    expect(off.picks).toEqual([]);
    expect(off.tracks.map((song) => song.id).sort()).toEqual(FIVE.map((song) => song.id).sort());
  });

  it('keeps a mixed-in song that is playing when smart shuffle is switched off', () => {
    const woven = weavePicks(smart(), EXTRA, 2);
    const onPick = jumpTo(woven, woven.order.indexOf(5));
    const off = cycleShuffle(onPick);

    expect(currentOf(off)?.id).toBe(EXTRA[0]?.id);
    expect(off.tracks).toHaveLength(6);
  });
});
