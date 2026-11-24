import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import type { StreamLimit } from '@ValenceContracts/schemas/StreamLimit';
import { useQualityLimit } from './useQualityLimit';

const fetchMyStreamLimit = vi.fn<() => Promise<StreamLimit>>();
const { serverHas } = vi.hoisted(() => ({
  serverHas: vi.fn<(feature: string) => boolean | null>(),
}));

vi.mock('@ValenceClient/streams/fetchMyStreamLimit', () => ({
  fetchMyStreamLimit: () => fetchMyStreamLimit(),
}));

vi.mock('@ValenceClient/about/useServerHas', () => ({
  useServerHas: (feature: string) => serverHas(feature),
}));

beforeEach(() => {
  fetchMyStreamLimit.mockReset().mockResolvedValue({
    maxBitrateKbps: null,
    maxStreams: null,
    maxQuality: '720p',
    limitsDownloads: true,
  });
  serverHas.mockReset().mockReturnValue(true);
});

describe('useQualityLimit', () => {
  it('reads the highest quality and whether downloads are held to it', async () => {
    const { result } = renderHookInACache(() => useQualityLimit());

    await waitFor(() => {
      expect(result.current).toEqual({ maxQuality: '720p', limitsDownloads: true });
    });
    expect(serverHas).toHaveBeenCalledWith('streams.qualityLimit');
  });

  it('holds nothing back where the account has no quality limit', async () => {
    fetchMyStreamLimit.mockResolvedValue({
      maxBitrateKbps: 8000,
      maxStreams: 2,
      maxQuality: null,
      limitsDownloads: false,
    });

    const { result } = renderHookInACache(() => useQualityLimit());

    await waitFor(() => {
      expect(fetchMyStreamLimit).toHaveBeenCalled();
    });
    expect(result.current).toEqual({ maxQuality: null, limitsDownloads: false });
  });

  it('holds nothing back before the limit has been read', () => {
    fetchMyStreamLimit.mockReturnValue(new Promise(() => undefined));

    expect(renderHookInACache(() => useQualityLimit()).result.current).toEqual({
      maxQuality: null,
      limitsDownloads: false,
    });
  });

  it('holds nothing back, and asks nothing, on a server without quality limits', () => {
    serverHas.mockReturnValue(false);

    expect(renderHookInACache(() => useQualityLimit()).result.current).toEqual({
      maxQuality: null,
      limitsDownloads: false,
    });

    serverHas.mockReturnValue(null);

    expect(renderHookInACache(() => useQualityLimit()).result.current).toEqual({
      maxQuality: null,
      limitsDownloads: false,
    });
    expect(fetchMyStreamLimit).not.toHaveBeenCalled();
  });
});
