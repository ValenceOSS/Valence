import { createElement } from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getRealtimeClient } from '@ValenceClient/realtime/getRealtimeClient';
import { aDormantRealtimeClient } from '@ValenceClient/realtime/aDormantRealtimeClient';
import { sendWatchedOffline } from '@ValenceClient/offline/watchedOffline';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { whicheverAnswers } from '@ValenceMobile/platform/whicheverAnswers';
import { useTheServer } from './useTheServer';
import type { ReactNode } from 'react';

jest.mock('@ValenceMobile/platform/whicheverAnswers');
jest.mock('@ValenceClient/offline/watchedOffline');
jest.mock('@ValenceClient/realtime/getRealtimeClient');

const aCache = () => {
  const cache = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const invalidate = jest.spyOn(cache, 'invalidateQueries').mockResolvedValue(undefined);
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client: cache }, children);

  return { invalidate, wrapper };
};

const socketIsLive = (isLive: boolean) => {
  jest.mocked(getRealtimeClient).mockReturnValue({
    ...aDormantRealtimeClient(),
    isLive: () => isLive,
  });
};

const comesBack = async (pickingUp: Parameters<typeof useTheServer>[0]) => {
  const { invalidate, wrapper } = aCache();

  jest.mocked(whicheverAnswers).mockResolvedValue(null);

  const { result } = await renderHook(() => useTheServer(pickingUp), { wrapper });

  await waitFor(() => {
    expect(result.current.isAway).toBe(true);
  });

  jest.mocked(whicheverAnswers).mockResolvedValue('http://one.local:8420');
  await act(() => {
    result.current.tryNow();
  });
  await waitFor(() => {
    expect(result.current.isAway).toBe(false);
  });

  return invalidate;
};

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
});

describe('useTheServer', () => {
  it('says the server is here while it answers', async () => {
    jest.mocked(whicheverAnswers).mockResolvedValue('http://one.local:8420');

    const { result } = await renderHook(() => useTheServer(), { wrapper: CacheScope });

    await waitFor(() => {
      expect(result.current.address).toBe('http://one.local:8420');
    });
    expect(result.current.isAway).toBe(false);
  });

  it('says it is away when it stops answering', async () => {
    jest.mocked(whicheverAnswers).mockResolvedValue(null);

    const { result } = await renderHook(() => useTheServer(), { wrapper: CacheScope });

    await waitFor(() => {
      expect(result.current.isAway).toBe(true);
    });
  });

  it('asks for everything afresh when the server is back, where it is the one picking up', async () => {
    const invalidate = await comesBack('here');

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledTimes(1);
    });
    expect(sendWatchedOffline).toHaveBeenCalled();
  });

  it('leaves picking up to another', async () => {
    const invalidate = await comesBack('elsewhere');

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('leaves it to a socket that is already back and has asked for everything itself', async () => {
    socketIsLive(true);

    const invalidate = await comesBack('beside the socket');

    expect(invalidate).not.toHaveBeenCalled();
  });

  it('asks for everything itself where the socket is not back yet', async () => {
    socketIsLive(false);

    const invalidate = await comesBack('beside the socket');

    await waitFor(() => {
      expect(invalidate).toHaveBeenCalledTimes(1);
    });
  });
});
