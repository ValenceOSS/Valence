import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { usePluginThemeChoice } from './usePluginThemeChoice';

beforeEach(() => {
  installPlatform(aFakePlatform());
});

describe('usePluginThemeChoice', () => {
  it('follows the choice as it changes', () => {
    const { result } = renderHook(() => usePluginThemeChoice());

    expect(result.current.choice).toBeNull();

    act(() => {
      result.current.choose('midnight-themes/deep-sea');
    });

    expect(result.current.choice).toBe('midnight-themes/deep-sea');
  });
});
