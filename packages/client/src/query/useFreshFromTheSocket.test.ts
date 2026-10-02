import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { musicQueries } from '@ValenceClient/query/musicQueries';
import { aFakeSocket as aSocket } from '@ValenceClient/testing/aFakeSocket';
import { pluginQueries } from '@ValenceClient/query/pluginQueries';
import { collectionQueries } from '@ValenceClient/query/collectionQueries';
import { useFreshFromTheSocket } from './useFreshFromTheSocket';
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
  cache = new QueryClient({ defaultOptions: { queries: { gcTime: Infinity } } });
  getRealtimeClient.mockReturnValue(undefined);
});

describe('useFreshFromTheSocket', () => {
  it('throws away the library when the server says the media changed', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    socket.say('media', ANYTHING);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['library'] });
  });

  it('throws away the music and the playlists too, so a scan of a music library shows up', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    socket.say('media', ANYTHING);

    expect(invalidate).toHaveBeenCalledWith({ queryKey: musicQueries.key });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: musicQueries.playlistsKey });
  });

  it('throws away the collections, so a collection changed elsewhere shows up', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    socket.say('media', ANYTHING);

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
    expect(invalidate).toHaveBeenCalledWith({ queryKey: ['admin'] });
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

  it('throws away everything after a reconnection, since it missed whatever happened', () => {
    const invalidate = vi.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
    const socket = aSocket();

    listening(socket);
    socket.reconnect();

    expect(invalidate).toHaveBeenCalledWith(undefined, { cancelRefetch: false });
  });

  it('stops listening once it is gone', () => {
    const socket = aSocket();

    listening(socket).unmount();

    expect(socket.stopped).toEqual([
      'media',
      'notifications',
      'profile',
      'requests',
      'keeping',
      'plugins',
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
