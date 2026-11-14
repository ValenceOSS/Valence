import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { usePictureRatio } from './usePictureRatio';
import type { PictureSize } from './SubtitleCues.types';

const reshape = (element: HTMLVideoElement, width: number, height: number) => {
  Object.defineProperty(element, 'videoWidth', { configurable: true, value: width });
  Object.defineProperty(element, 'videoHeight', { configurable: true, value: height });
};

const aVideoShowing = (width: number, height: number) => {
  const element = document.createElement('video');

  reshape(element, width, height);

  return { current: element };
};

describe('usePictureRatio', () => {
  it('reads the picture’s shape from the video', async () => {
    const video = aVideoShowing(1920, 800);
    const { result } = renderHook(() => usePictureRatio(video, undefined));

    await waitFor(() => {
      expect(result.current).toBe(2.4);
    });
  });

  it('follows the picture when it changes shape', async () => {
    const video = aVideoShowing(1920, 1080);
    const { result } = renderHook(() => usePictureRatio(video, undefined));

    await waitFor(() => {
      expect(result.current).toBe(16 / 9);
    });

    reshape(video.current, 1440, 1080);

    await waitFor(() => {
      expect(result.current).toBe(4 / 3);
    });
  });

  it('takes the shape the engine draws where the video carries only the sound', async () => {
    const picture: { current: PictureSize | null } = { current: null };
    const video = aVideoShowing(0, 0);
    const { result } = renderHook(() => usePictureRatio(video, picture));

    picture.current = { width: 720, height: 576 };

    await waitFor(() => {
      expect(result.current).toBe(1.25);
    });
  });

  it('prefers the video’s own picture to the engine’s', async () => {
    const video = aVideoShowing(2000, 1000);
    const picture = { current: { width: 720, height: 576 } };
    const { result } = renderHook(() => usePictureRatio(video, picture));

    await waitFor(() => {
      expect(result.current).toBe(2);
    });
  });

  it('knows no shape while there is no picture to measure', async () => {
    const video = aVideoShowing(0, 0);
    const { result } = renderHook(() => usePictureRatio(video, { current: null }));

    await new Promise((resolve) => {
      setTimeout(resolve, 60);
    });

    expect(result.current).toBeNull();
  });

  it('knows no shape without a video', () => {
    const { result } = renderHook(() => usePictureRatio(undefined, undefined));

    expect(result.current).toBeNull();
  });
});
