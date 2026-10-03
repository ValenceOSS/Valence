import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, waitFor } from '@testing-library/react';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { fetchPluginSurface } from '@ValenceClient/plugins/fetchPluginSurface';
import { actOnPluginSurface } from '@ValenceClient/plugins/actOnPluginSurface';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import { usePluginSurface } from './usePluginSurface';

vi.mock('@ValenceClient/plugins/fetchPluginSurface', () => ({ fetchPluginSurface: vi.fn() }));
vi.mock('@ValenceClient/plugins/actOnPluginSurface', () => ({ actOnPluginSurface: vi.fn() }));

const place = { kind: 'page' as const, pluginId: 'anilist', pageId: 'tracking' };

const first = SurfaceSchema.parse({ blocks: [{ type: 'text', text: 'First' }] });

const next = SurfaceSchema.parse({ blocks: [{ type: 'text', text: 'Next' }] });

const aHost = (confirms = true) => ({
  askToConfirm: vi.fn(() => Promise.resolve(confirms)),
  openOnServer: vi.fn(() => Promise.resolve()),
});

beforeEach(() => {
  installPlatform(aFakePlatform());
  vi.mocked(fetchPluginSurface).mockReset();
  vi.mocked(fetchPluginSurface).mockResolvedValue(first);
  vi.mocked(actOnPluginSurface).mockReset();
});

describe('usePluginSurface', () => {
  it('reads the page and replaces it with what the plugin draws next', async () => {
    vi.mocked(actOnPluginSurface).mockResolvedValue({ kind: 'surface', surface: next });
    const { result } = renderHookInACache(() => usePluginSurface(place, aHost()));

    await waitFor(() => {
      expect(result.current.surface).toEqual(first);
    });

    act(() => {
      result.current.act({ id: 'go' }, { name: 'dan' });
    });

    await waitFor(() => {
      expect(result.current.surface).toEqual(next);
    });
    expect(actOnPluginSurface).toHaveBeenCalledWith(place, {
      action: { id: 'go' },
      fields: { name: 'dan' },
    });
  });

  it('asks first where the plugin wants a press confirmed, and sends nothing when refused', async () => {
    const host = aHost(false);
    const { result } = renderHookInACache(() => usePluginSurface(place, host));

    await waitFor(() => {
      expect(result.current.surface).toBeDefined();
    });

    act(() => {
      result.current.act({ id: 'forget', confirm: 'Remove it all?' }, {});
    });

    await waitFor(() => {
      expect(host.askToConfirm).toHaveBeenCalledWith('Remove it all?');
    });
    expect(actOnPluginSurface).not.toHaveBeenCalled();
  });

  it('opens where the server sends somebody, then reads the page again', async () => {
    vi.mocked(actOnPluginSurface).mockResolvedValue({
      kind: 'navigate',
      to: '/api/plugins/anilist/connect',
    });
    const host = aHost();
    const { result } = renderHookInACache(() => usePluginSurface(place, host));

    await waitFor(() => {
      expect(result.current.surface).toBeDefined();
    });

    act(() => {
      result.current.act({ id: 'valence.accounts.connect', payload: { provider: 'anilist' } }, {});
    });

    await waitFor(() => {
      expect(host.openOnServer).toHaveBeenCalledWith('/api/plugins/anilist/connect');
    });
    await waitFor(() => {
      expect(fetchPluginSurface).toHaveBeenCalledTimes(2);
    });
  });

  it('reads the page again where the press changed nothing it drew', async () => {
    vi.mocked(actOnPluginSurface).mockResolvedValue({ kind: 'unchanged' });
    const { result } = renderHookInACache(() => usePluginSurface(place, aHost()));

    await waitFor(() => {
      expect(result.current.surface).toBeDefined();
    });

    act(() => {
      result.current.act({ id: 'refresh' }, {});
    });

    await waitFor(() => {
      expect(fetchPluginSurface).toHaveBeenCalledTimes(2);
    });
  });

  it('says what went wrong, in the server’s words or its own', async () => {
    vi.mocked(actOnPluginSurface)
      .mockRejectedValueOnce(new Error('No, not now.'))
      .mockRejectedValueOnce(new Error(''));
    const { result } = renderHookInACache(() => usePluginSurface(place, aHost()));

    await waitFor(() => {
      expect(result.current.surface).toBeDefined();
    });

    act(() => {
      result.current.act({ id: 'go' }, {});
    });

    await waitFor(() => {
      expect(result.current.problem).toBe('No, not now.');
    });

    act(() => {
      result.current.act({ id: 'go' }, {});
    });

    await waitFor(() => {
      expect(result.current.problem).toBe('That didn’t work. Try again in a moment.');
    });
    expect(result.current.isActing).toBe(false);
  });

  it('reads the page again when asked to', async () => {
    vi.mocked(fetchPluginSurface).mockRejectedValueOnce(new Error('Away')).mockResolvedValue(first);
    const { result } = renderHookInACache(() => usePluginSurface(place, aHost()));

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    act(() => {
      result.current.retry();
    });

    await waitFor(() => {
      expect(result.current.surface).toEqual(first);
    });
  });
});
