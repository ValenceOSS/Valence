import { describe, expect, it, vi } from 'vitest';
import { startListening } from '@ValenceClient/books/startListening';
import { aFakeAudiobookPlayer } from '@ValenceClient/testing/aFakeAudiobookPlayer';
import { anAudiobook } from '@ValenceClient/testing/anAudiobook';

const PLACE = {
  bookId: anAudiobook().book.id,
  chapterId: anAudiobook().chapters[0]?.id ?? '',
  positionSeconds: 120,
  isFinished: false,
  updatedAt: '2026-09-23T00:00:00.000Z',
};

describe('startListening', () => {
  it('starts a book where somebody left off', async () => {
    const { player, audio } = aFakeAudiobookPlayer();
    const detail = anAudiobook();

    await startListening(detail, player, () => Promise.resolve(PLACE));

    expect(audio.src).toContain(PLACE.chapterId);
    expect(player.read().bookPositionSeconds).toBe(720);
  });

  it('starts a finished book, or one nobody started, from the beginning', async () => {
    const { player } = aFakeAudiobookPlayer();

    await startListening(anAudiobook(), player, () =>
      Promise.resolve({ ...PLACE, isFinished: true }),
    );

    expect(player.read().bookPositionSeconds).toBe(0);
  });

  it('carries on with the book already playing, rather than going back', async () => {
    const { player } = aFakeAudiobookPlayer();
    const readPlace = vi.fn(() => Promise.resolve(PLACE));

    await startListening(anAudiobook(), player, readPlace);
    player.pause();
    await startListening(anAudiobook(), player, readPlace);

    expect(readPlace).toHaveBeenCalledTimes(1);
    expect(player.read().isPlaying).toBe(true);
  });

  it('does nothing with a book there is nothing to hear in', async () => {
    const { player } = aFakeAudiobookPlayer();

    await startListening({ ...anAudiobook(), chapters: [] }, player, () => Promise.resolve(null));

    expect(player.read().book).toBeNull();
  });
});
