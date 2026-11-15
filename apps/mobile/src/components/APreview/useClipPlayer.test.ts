import { act, renderHook } from '@testing-library/react-native';
import { theFakePlayer } from '@ValenceMobile/testing/theFakePlayer';
import { useClipPlayer } from './useClipPlayer';

describe('useClipPlayer', () => {
  it('makes one player, holding nothing until a clip is loaded into it', async () => {
    const { result } = await renderHook(() => useClipPlayer());

    expect(result.current.player).toBe(theFakePlayer);
    expect(result.current.source).toBeNull();
  });

  it('holds the clip loaded into it, and plays it', async () => {
    const { result } = await renderHook(() => useClipPlayer());
    const clip = { uri: 'http://one.local/api/media/arrival/preview' };

    await act(() => {
      result.current.load(clip);
    });

    expect(result.current.source).toBe(clip);
    expect(theFakePlayer.source).toBe(clip.uri);
  });

  it('lets a clip go only while it is the one held', async () => {
    const { result } = await renderHook(() => useClipPlayer());
    const first = { uri: 'http://one.local/api/media/arrival/preview' };
    const next = { uri: 'http://one.local/api/media/dune/preview' };

    await act(() => {
      result.current.load(first);
      result.current.load(next);
    });
    await act(() => {
      result.current.letGo(first);
    });

    expect(result.current.source).toBe(next);

    await act(() => {
      result.current.letGo(next);
    });

    expect(result.current.source).toBeNull();
  });

  it('hands out the same player and the same ways to use it however often it is drawn', async () => {
    const drawn = await renderHook(() => useClipPlayer());
    const before = drawn.result.current;

    await drawn.rerender({});

    expect(drawn.result.current).toBe(before);
  });
});
