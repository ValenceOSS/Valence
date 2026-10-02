import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { DEFAULT_CAPTION_STYLE, readCaptionStyle } from '@ValenceClient/playback/captionStyle';
import { useCaptionStyle } from './useCaptionStyle';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('useCaptionStyle', () => {
  it('starts from what this device remembers', () => {
    const { result } = renderHook(() => useCaptionStyle());

    expect(result.current.style).toEqual(DEFAULT_CAPTION_STYLE);
  });

  it('changes the style and remembers it on the device', () => {
    const { result } = renderHook(() => useCaptionStyle());

    act(() => {
      result.current.change({ ...DEFAULT_CAPTION_STYLE, fontScale: 150 });
    });

    expect(result.current.style.fontScale).toBe(150);
    expect(readCaptionStyle().fontScale).toBe(150);
  });
});
