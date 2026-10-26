import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform, platformInUse } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import type { ListeningPlace } from '@ValenceClient/books/createAudiobookPlayer';
import type { ListeningProgress } from '@ValenceContracts/schemas/Book';
import {
  forgetListenedOffline,
  listenedOffline,
  rememberListenedOffline,
  sendListenedOffline,
} from './listenedOffline';

const RED_RISING = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b0b';

const GOLDEN_SON = '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0b0c';

const HERE = 'https://valence.example';

const ELSEWHERE = 'https://elsewhere.example';

const HEARD_AT = Date.parse('2026-10-21T00:00:00.000Z');

const STORAGE_KEY = 'valence.offline.listened';

const saveListeningProgress = vi.fn<(bookId: string, place: ListeningPlace) => Promise<boolean>>();
const fetchListeningProgress = vi.fn<(bookId: string) => Promise<ListeningProgress | null>>();

vi.mock('@ValenceClient/books/fetchListening', () => ({
  saveListeningProgress: (bookId: string, place: ListeningPlace) =>
    saveListeningProgress(bookId, place),
  fetchListeningProgress: (bookId: string) => fetchListeningProgress(bookId),
}));

/**
 * Somewhere partway through a book.
 *
 * @param positionSeconds - How far into the track.
 * @returns The place.
 */
const aPlace = (positionSeconds: number): ListeningPlace => ({
  chapterId: '6f4e0c1a-8b0b-4c55-9d7d-6a6a7f0c0c01',
  positionSeconds,
  isFinished: false,
});

/**
 * Where the server says somebody got to in a book, and when it heard.
 *
 * @param bookId - The book.
 * @param updatedAt - When the server heard.
 * @returns What the server knows.
 */
const theServerHeard = (bookId: string, updatedAt: string): ListeningProgress => ({
  bookId,
  ...aPlace(60),
  updatedAt,
});

/**
 * Pretends this device is talking to a server.
 *
 * @param server - Its address.
 */
const talkTo = (server: string): void => {
  installPlatform({
    ...aFakePlatform(),
    store: platformInUse().store,
    serverAddress: () => server,
  });
};

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => HERE }));
  saveListeningProgress.mockReset().mockResolvedValue(true);
  fetchListeningProgress.mockReset().mockResolvedValue(null);
});

describe('rememberListenedOffline', () => {
  it('writes down where somebody got to, to read back', () => {
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);

    expect(listenedOffline(RED_RISING)).toEqual(aPlace(120));
  });

  it('writes down when, so a newer place on the server can win', () => {
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);

    expect(JSON.parse(platformInUse().store.read(STORAGE_KEY) ?? '[]')).toEqual([
      { bookId: RED_RISING, ...aPlace(120), server: HERE, atMs: HEARD_AT },
    ]);
  });

  it('keeps one place a book, the latest', () => {
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);
    rememberListenedOffline(RED_RISING, aPlace(400), HEARD_AT + 1000);

    expect(listenedOffline(RED_RISING)).toEqual(aPlace(400));
    expect(JSON.parse(platformInUse().store.read(STORAGE_KEY) ?? '[]')).toHaveLength(1);
  });

  it('keeps a separate place for a separate book', () => {
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);
    rememberListenedOffline(GOLDEN_SON, aPlace(30), HEARD_AT);

    expect(listenedOffline(RED_RISING)).toEqual(aPlace(120));
    expect(listenedOffline(GOLDEN_SON)).toEqual(aPlace(30));
  });

  it('keeps a separate place for the same book on another server', () => {
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);
    talkTo(ELSEWHERE);
    rememberListenedOffline(RED_RISING, aPlace(900), HEARD_AT);

    expect(listenedOffline(RED_RISING)).toEqual(aPlace(900));

    talkTo(HERE);

    expect(listenedOffline(RED_RISING)).toEqual(aPlace(120));
  });
});

describe('forgetListenedOffline', () => {
  it('forgets one book’s place, keeping every other', () => {
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);
    rememberListenedOffline(GOLDEN_SON, aPlace(30), HEARD_AT);
    forgetListenedOffline(RED_RISING);

    expect(listenedOffline(RED_RISING)).toBeNull();
    expect(listenedOffline(GOLDEN_SON)).toEqual(aPlace(30));
  });

  it('keeps the same book’s place on another server', () => {
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);
    talkTo(ELSEWHERE);
    forgetListenedOffline(RED_RISING);
    talkTo(HERE);

    expect(listenedOffline(RED_RISING)).toEqual(aPlace(120));
  });

  it('leaves nothing written once the last place is forgotten', () => {
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);
    forgetListenedOffline(RED_RISING);

    expect(platformInUse().store.read(STORAGE_KEY)).toBeNull();
  });
});

describe('listenedOffline', () => {
  it('knows nothing of a book nobody listened to offline', () => {
    expect(listenedOffline(RED_RISING)).toBeNull();
  });

  it('reads nothing from a list it cannot make sense of', () => {
    platformInUse().store.write(STORAGE_KEY, JSON.stringify({ not: 'a list' }));

    expect(listenedOffline(RED_RISING)).toBeNull();
  });

  it('reads nothing from something that was never a list at all', () => {
    platformInUse().store.write(STORAGE_KEY, '{not json');

    expect(listenedOffline(RED_RISING)).toBeNull();
  });

  it('starts again from what cannot be read as it remembers something new', () => {
    platformInUse().store.write(STORAGE_KEY, '{not json');
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);

    expect(listenedOffline(RED_RISING)).toEqual(aPlace(120));
  });

  it('reads a place written before places said when they were heard', () => {
    platformInUse().store.write(
      STORAGE_KEY,
      JSON.stringify([{ bookId: RED_RISING, ...aPlace(120), server: HERE }]),
    );

    expect(listenedOffline(RED_RISING)).toEqual(aPlace(120));
  });
});

describe('sendListenedOffline', () => {
  it('tells the server nothing where nothing was heard offline', async () => {
    expect(await sendListenedOffline()).toBe(0);
    expect(fetchListeningProgress).not.toHaveBeenCalled();
    expect(saveListeningProgress).not.toHaveBeenCalled();
  });

  it('tells the server where each book got to, and forgets it once heard', async () => {
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);
    rememberListenedOffline(GOLDEN_SON, { ...aPlace(30), isFinished: true }, HEARD_AT);

    expect(await sendListenedOffline()).toBe(2);
    expect(saveListeningProgress).toHaveBeenCalledWith(RED_RISING, aPlace(120));
    expect(saveListeningProgress).toHaveBeenCalledWith(GOLDEN_SON, {
      ...aPlace(30),
      isFinished: true,
    });
    expect(listenedOffline(RED_RISING)).toBeNull();
    expect(platformInUse().store.read(STORAGE_KEY)).toBeNull();
  });

  it('tells the server where it last heard of somewhere older', async () => {
    fetchListeningProgress.mockResolvedValue(
      theServerHeard(RED_RISING, '2026-10-20T00:00:00.000Z'),
    );
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);

    expect(await sendListenedOffline()).toBe(1);
    expect(saveListeningProgress).toHaveBeenCalledWith(RED_RISING, aPlace(120));
  });

  it('forgets without telling where the server has heard of somewhere newer since', async () => {
    fetchListeningProgress.mockResolvedValue(
      theServerHeard(RED_RISING, '2026-10-22T00:00:00.000Z'),
    );
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);

    expect(await sendListenedOffline()).toBe(0);
    expect(saveListeningProgress).not.toHaveBeenCalled();
    expect(listenedOffline(RED_RISING)).toBeNull();
  });

  it('forgets without telling where the server heard of somewhere at the very same moment', async () => {
    fetchListeningProgress.mockResolvedValue(
      theServerHeard(RED_RISING, new Date(HEARD_AT).toISOString()),
    );
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);

    expect(await sendListenedOffline()).toBe(0);
    expect(saveListeningProgress).not.toHaveBeenCalled();
  });

  it('keeps it all for next time where the server could not say where it had got to', async () => {
    fetchListeningProgress.mockRejectedValue(new Error('offline'));
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);

    expect(await sendListenedOffline()).toBe(0);
    expect(saveListeningProgress).not.toHaveBeenCalled();
    expect(listenedOffline(RED_RISING)).toEqual(aPlace(120));
  });

  it('keeps what the server did not hear, for next time', async () => {
    saveListeningProgress.mockImplementation((bookId) => Promise.resolve(bookId === GOLDEN_SON));
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);
    rememberListenedOffline(GOLDEN_SON, aPlace(30), HEARD_AT);

    expect(await sendListenedOffline()).toBe(1);
    expect(listenedOffline(RED_RISING)).toEqual(aPlace(120));
    expect(listenedOffline(GOLDEN_SON)).toBeNull();
  });

  it('keeps what was heard against another server for when that server is in use', async () => {
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);
    talkTo(ELSEWHERE);

    expect(await sendListenedOffline()).toBe(0);
    expect(fetchListeningProgress).not.toHaveBeenCalled();

    talkTo(HERE);

    expect(listenedOffline(RED_RISING)).toEqual(aPlace(120));
  });

  it('keeps a place heard while the server was being told', async () => {
    rememberListenedOffline(RED_RISING, aPlace(120), HEARD_AT);
    saveListeningProgress.mockImplementation(() => {
      rememberListenedOffline(RED_RISING, aPlace(180), HEARD_AT + 1000);

      return Promise.resolve(true);
    });

    expect(await sendListenedOffline()).toBe(1);
    expect(listenedOffline(RED_RISING)).toEqual(aPlace(180));
  });
});
