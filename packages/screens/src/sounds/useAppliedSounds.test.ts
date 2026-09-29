import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { chooseSounds } from '@ValenceClient/shell/sounds';
import { useAppliedSounds } from './useAppliedSounds';

const switched = vi.hoisted(() => vi.fn());

vi.mock('@ValenceUI/sounds/switchSounds', () => ({ switchSounds: switched }));

beforeEach(() => {
  switched.mockReset();
  installPlatform(aFakePlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('useAppliedSounds', () => {
  it('keeps sounds off until somebody turns them on, then follows them', () => {
    renderHook(() => {
      useAppliedSounds();
    });

    act(() => {
      chooseSounds(true);
    });
    act(() => {
      chooseSounds(false);
    });

    expect(switched.mock.calls).toEqual([[false], [true], [false]]);
  });
});
