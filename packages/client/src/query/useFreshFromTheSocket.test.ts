import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { aFakeSocket as aSocket } from '@ValenceClient/testing/aFakeSocket';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { collectionQueries } from '@ValenceClient/query/collectionQueries';
import { sessionQueries } from '@ValenceClient/query/sessionQueries';
import { libraryQueries } from '@ValenceClient/query/libraryQueries';
import { artworkRevisions } from '@ValenceClient/library/artworkRevisions';
import {
  MEDIA_SETTLES_AFTER_MS,
  MEDIA_WAITS_AT_MOST_MS,
  useFreshFromTheSocket,
} from './useFreshFromTheSocket';
import type { RealtimeEvent } from '@ValenceContracts/schemas/Realtime';
import type { ReactNode } from 'react';

const getRealtimeClient = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/realtime/getRealtimeClient', () => ({ getRealtimeClient }));

const ANYTHING: RealtimeEvent = {
  kind: 'event',
  topic: 'media',
  atMs: 0,
  folded: 0,
  payload: null,
};

let cache: QueryClient;

const listening = (socket: ReturnType<typeof aSocket>) =>
  renderHook(
    () => {
      useFreshFromTheSocket(socket.client);
    },
    {
      wrapper: ({ children }: { children: ReactNode }) =>
        createElement(QueryClientProvider, { client: cache }, children),
    },
  );

beforeEach(() => {
  vi.useFakeTimers();
  cache = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  getRealtimeClient.mockReturnValue(undefined);
});

afterEach(() => {
  vi.useRealTimers();
});

/**
 * Says something about the media on a socket, and waits for it to settle.
 *
 * @param socket - The socket.
 * @param payload - What it says.
 * @param folded - How many events the server folded into it.
 */
const mediaSays = (
  socket: ReturnType<typeof aSocket>,
  payload: RealtimeEvent['payload'],
  folded = 0,
): void => {
  socket.say('media', { ...ANYTHING, payload, folded });
  vi.advanceTimersByTime(MEDIA_SETTLES_AFTER_MS);
};

describe('useFreshFromTheSocket', () => {
  it('throws away the library when the server says the media changed', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    socket.say('media', ANYTHING);
    vi.advanceTimersByTime(MEDIA_SETTLES_AFTER_MS);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['library'] });
  });

  it('throws away what the requests say is held too, so a title deleted stops showing as here', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    socket.say('media', ANYTHING);
    vi.advanceTimersByTime(MEDIA_SETTLES_AFTER_MS);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['requests'] });
  });

  it('throws away the rows like what was watched, so a title added or gone shows in them', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    socket.say('media', ANYTHING);
    vi.advanceTimersByTime(MEDIA_SETTLES_AFTER_MS);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['viewing', 'because-you-watched'] });
  });

  it('throws away the music and the playlists too, so a scan of a music library shows up', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    socket.say('media', ANYTHING);
    vi.advanceTimersByTime(MEDIA_SETTLES_AFTER_MS);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: musicQueries.key });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: musicQueries.playlistsKey });
  });

  it('throws away the collections, so a collection changed elsewhere shows up', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    socket.say('media', ANYTHING);
    vi.advanceTimersByTime(MEDIA_SETTLES_AFTER_MS);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: collectionQueries.key });
  });

  it('throws away the inbox, the session and the admin page for their own news', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    socket.say('notifications', ANYTHING);
    socket.say('profile', ANYTHING);
    socket.say('sessions', ANYTHING);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['notifications'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['session'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'sessions'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'overview'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin', 'monitor'] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ['admin'] });
  });

  it('reads the profiles again when who is watching changes in another tab', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    socket.say('profile', ANYTHING);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['profiles'] });
  });

  it('asks again who is signed in when an administrator stops this tab, and not for anything else', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    socket.say('presence', {
      ...ANYTHING,
      topic: 'presence',
      payload: { kind: 'message', text: 'Hi' },
    });

    expect(invalidate).not.toHaveBeenCalled();

    socket.say('presence', {
      ...ANYTHING,
      topic: 'presence',
      payload: { kind: 'stopped', reason: 'An administrator signed this device out.' },
    });

    expect(invalidate).toHaveBeenCalledWith({ queryKey: sessionQueries.who().queryKey });
  });

  it('throws away the downloads when one of them moves on, in place of asking every few seconds', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    socket.say('keeping', ANYTHING);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['downloads'] });
  });

  it('throws away what the plugins add when one of them is installed, changed or turned off', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    socket.say('plugins', ANYTHING);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: pluginQueries.key });
  });

  it('marks everything out of date after a reconnection, since news may have been missed, and asks again for what is on screen', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    socket.reconnect();

    expect(invalidate).toHaveBeenCalledTimes(1);
    expect(invalidate).toHaveBeenCalledWith(undefined, { cancelRefetch: false });
  });

  it('waits for a run of media events to settle, then refreshes once', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    socket.say('media', ANYTHING);
    vi.advanceTimersByTime(MEDIA_SETTLES_AFTER_MS - 1);
    socket.say('media', ANYTHING);
    vi.advanceTimersByTime(MEDIA_SETTLES_AFTER_MS - 1);

    expect(invalidate).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);

    expect(invalidate.mock.calls.filter(([asked]) => asked?.queryKey?.[0] === 'library')).toEqual([
      [{ queryKey: ['library'] }],
    ]);
  });

  it('does not wait for ever on media events that never settle', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);

    for (let waited = 0; waited < MEDIA_WAITS_AT_MOST_MS; waited += 1_000) {
      socket.say('media', ANYTHING);
      vi.advanceTimersByTime(1_000);
    }

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['library'] });
  });

  it('asks again only for the titles whose details changed, and the home page rows', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    mediaSays(socket, { event: 'metadata', mediaIds: ['one'] });

    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ['library'] });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['library'], refetchType: 'none' });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ['requests'] });
  });

  it('only notes new artwork, asking again for the pages of those titles alone', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const bump = vi.spyOn(artworkRevisions, 'bump');
    const socket = aSocket();

    listening(socket);
    mediaSays(socket, { event: 'artwork', mediaIds: ['one', 'two'] });

    expect(bump).toHaveBeenCalledWith(['one', 'two']);
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: ['library'] });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: musicQueries.key });
  });

  it('refreshes everything where the server folded several events into one', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    mediaSays(socket, { event: 'artwork', mediaIds: ['one'] }, 3);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: libraryQueries.key });
  });

  it('forgets a run of media events still settling once it is gone', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();
    const listened = listening(socket);

    socket.say('media', ANYTHING);
    listened.unmount();
    vi.advanceTimersByTime(MEDIA_WAITS_AT_MOST_MS);

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('stops listening once it is gone', () => {
    const socket = aSocket();

    listening(socket).unmount();

    expect(socket.stopped).toEqual([
      'media',
      'notifications',
      'presence',
      'profile',
      'requests',
      'keeping',
      'plugins',
      'audit',
      'linking',
      'announcement',
      'sessions',
      'resumed',
    ]);
  });

  it('asks for the shared socket when it is not given one', () => {
    getRealtimeClient.mockReturnValue(aSocket().client);

    renderHook(
      () => {
        useFreshFromTheSocket();
      },
      {
        wrapper: ({ children }: { children: ReactNode }) =>
          createElement(QueryClientProvider, { client: cache }, children),
      },
    );

    expect(getRealtimeClient).toHaveBeenCalled();
  });

  it('listens for nothing where there is nobody signed in yet to hear about a change', () => {
    getRealtimeClient.mockClear();

    renderHook(
      () => {
        useFreshFromTheSocket(null);
      },
      {
        wrapper: ({ children }: { children: ReactNode }) =>
          createElement(QueryClientProvider, { client: cache }, children),
      },
    );

    expect(getRealtimeClient).not.toHaveBeenCalled();
  });
});
