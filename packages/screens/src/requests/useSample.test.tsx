import { act, renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSample } from './useSample';
import type { ReactNode } from 'react';

const fetchSampleMock = vi.hoisted(() => vi.fn());

const sayMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/requests/fetchSample', () => ({ fetchSample: fetchSampleMock }));
vi.mock('@ValenceUI/notify', () => ({ notify: { say: sayMock } }));

const played: string[] = [];

const paused: string[] = [];

class FakeAudio {
  src: string;

  constructor(src: string) {
    this.src = src;
  }

  addEventListener() {}

  play() {
    played.push(this.src);

    return Promise.resolve();
  }

  pause() {
    paused.push(this.src);
  }
}

/**
 * Draws the hook inside a cache of its own.
 *
 * @param children - What is drawn.
 * @returns It, with a cache.
 */
const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
);

beforeEach(() => {
  played.length = 0;
  paused.length = 0;
  fetchSampleMock.mockReset();
  sayMock.mockReset();
  vi.stubGlobal('Audio', FakeAudio);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('useSample', () => {
  it('plays an album’s sample, and stops it when pressed again', async () => {
    fetchSampleMock.mockResolvedValue('https://a.apple.com/loss.m4a');
    const { result } = renderHook(() => useSample(), { wrapper });

    await act(() => result.current.toggle('loss', 'Drake', 'Her Loss'));

    expect(played).toEqual(['https://a.apple.com/loss.m4a']);
    expect(result.current.heard).toBe('loss');

    await act(() => result.current.toggle('loss', 'Drake', 'Her Loss'));

    expect(paused).toEqual(['https://a.apple.com/loss.m4a']);
    expect(result.current.heard).toBeNull();
  });

  it('stops one sample when another starts', async () => {
    fetchSampleMock.mockImplementation((_artist: string, album: string) =>
      Promise.resolve(`https://a.apple.com/${album}.m4a`),
    );
    const { result } = renderHook(() => useSample(), { wrapper });

    await act(() => result.current.toggle('a', 'Drake', 'Views'));
    await act(() => result.current.toggle('b', 'Drake', 'Scorpion'));

    expect(paused).toEqual(['https://a.apple.com/Views.m4a']);
    expect(result.current.heard).toBe('b');
  });

  it('says so where there is no sample to hear', async () => {
    fetchSampleMock.mockResolvedValue(null);
    const { result } = renderHook(() => useSample(), { wrapper });

    await act(() => result.current.toggle('x', 'Drake', 'Nothing Was the Same'));

    expect(sayMock).toHaveBeenCalledWith('There is no sample of Nothing Was the Same to hear.');
    expect(played).toEqual([]);
  });
});
