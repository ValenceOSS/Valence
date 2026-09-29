import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { chooseSounds } from '@ValenceClient/shell/sounds';
import { useSounds } from './useSounds';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

afterEach(() => {
  forgetPlatform();
});

describe('useSounds', () => {
  it('starts off, and with what this device already remembers', () => {
    expect(renderHook(() => useSounds()).result.current.isOn).toBe(false);

    chooseSounds(true);

    expect(renderHook(() => useSounds()).result.current.isOn).toBe(true);
  });

  it('turns them on and off through it', () => {
    const { result } = renderHook(() => useSounds());

    act(() => {
      result.current.choose(true);
    });

    expect(result.current.isOn).toBe(true);
  });
});
