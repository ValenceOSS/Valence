import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useToneMappingCheck } from './useToneMappingCheck';

const asked = vi.hoisted(() => ({ readEngineSupport: vi.fn() }));

vi.mock('@ValenceScreens/playback/readEngineSupport', () => ({
  readEngineSupport: asked.readEngineSupport,
}));

const SUPPORT = {
  videoCodecs: [],
  tenBitVideoCodecs: ['hevc'],
  remuxVideoCodecs: [],
  remuxTenBitVideoCodecs: ['hevc'],
  toneMappedCodecs: [],
  toneMappingChecks: { hevc: { outcome: 'changed', grey: 97 } },
  audioCodecs: ['eac3'],
};

describe('useToneMappingCheck', () => {
  it('says how the check went for the film’s codec', async () => {
    asked.readEngineSupport.mockResolvedValue(SUPPORT);

    const { result } = renderHook(() => useToneMappingCheck('hevc', true));

    await waitFor(() => {
      expect(result.current).toEqual({ outcome: 'changed', grey: 97 });
    });
  });

  it('says nothing for a codec that was never checked', async () => {
    asked.readEngineSupport.mockResolvedValue(SUPPORT);

    const { result } = renderHook(() => useToneMappingCheck('h264', true));

    await waitFor(() => {
      expect(asked.readEngineSupport).toHaveBeenCalled();
    });
    expect(result.current).toBeNull();
  });

  it('does not ask where it is not wanted', () => {
    asked.readEngineSupport.mockReset();

    renderHook(() => useToneMappingCheck('hevc', false));

    expect(asked.readEngineSupport).not.toHaveBeenCalled();
  });
});
