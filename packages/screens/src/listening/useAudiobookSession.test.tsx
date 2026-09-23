import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { tracksOf } from '@ValenceScreens/listening/tracksOf';
import { useAudiobookPlayer } from '@ValenceScreens/listening/useAudiobookPlayer';
import { useAudiobookSession } from '@ValenceScreens/listening/useAudiobookSession';
import { aFakeAudiobookPlayer } from '@ValenceScreens/testing/aFakeAudiobookPlayer';
import { aFakeMediaSession } from '@ValenceScreens/testing/aFakeMediaSession';
import { anAudiobook } from '@ValenceScreens/testing/anAudiobook';

let session = aFakeMediaSession();

beforeEach(() => {
  session = aFakeMediaSession();
});

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'mediaSession');
});

/**
 * Listens to the book with the system's controls told about it.
 *
 * @returns The player and its audio.
 */
const listening = () => {
  const fake = aFakeAudiobookPlayer();
  const { book, chapters } = anAudiobook();

  renderHook(() => {
    const { state, player } = useAudiobookPlayer(fake.player);

    useAudiobookSession(state, player);
  });

  act(() => {
    fake.player.open(book, tracksOf(chapters), null);
    fake.audio.fire('loadedmetadata');
    fake.audio.fire('playing');
  });

  return fake;
};

describe('useAudiobookSession', () => {
  it('says which book is playing, and by whom', () => {
    listening();

    expect(session.metadata).toMatchObject({ title: 'Red Rising', artist: 'Pierce Brown' });
    expect(session.playbackState).toBe('playing');
  });

  it('skips back and on, and between chapters, from the system’s buttons', () => {
    const { player } = listening();

    act(() => {
      session.press('seekforward');
    });

    expect(player.read().bookPositionSeconds).toBe(30);

    act(() => {
      session.press('seekbackward', { seekOffset: 10 });
    });

    expect(player.read().bookPositionSeconds).toBe(20);

    act(() => {
      session.press('nexttrack');
    });

    expect(player.read().bookPositionSeconds).toBe(600);
  });

  it('pauses from the system’s buttons, and gives them up once the book is closed', () => {
    const { player, audio } = listening();

    act(() => {
      session.press('pause');
    });

    expect(audio.pause).toHaveBeenCalled();

    act(() => {
      player.close();
    });

    expect(session.metadata).toBeNull();
  });
});
