import { renderHook, waitFor } from '@testing-library/react-native';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { whicheverAnswers } from '@ValencePhone/platform/whicheverAnswers';
import { useTheServer } from './useTheServer';

jest.mock('@ValencePhone/platform/whicheverAnswers');

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
});
