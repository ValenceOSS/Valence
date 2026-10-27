import { waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderHookInACache } from '@ValenceClient/testing/renderHookInACache';
import { somePluginContributions } from '@ValenceClient/testing/somePluginContributions';
import type { MyPermissions } from '@ValenceContracts/schemas/Permission';
import type { PluginContributions } from '@ValenceContracts/schemas/Plugin';
import { useMayStream } from './useMayStream';

const fetchMyPermissions = vi.fn<() => Promise<MyPermissions>>();
const fetchPluginContributions = vi.fn<() => Promise<PluginContributions>>();
const { serverHas } = vi.hoisted(() => ({
  serverHas: vi.fn<(feature: string) => boolean | null>(),
}));

vi.mock('@ValenceClient/session/fetchMyPermissions', () => ({
  fetchMyPermissions: () => fetchMyPermissions(),
}));

vi.mock('@ValenceClient/plugins/fetchPluginContributions', () => ({
  fetchPluginContributions: () => fetchPluginContributions(),
}));

vi.mock('@ValenceClient/about/useServerHas', () => ({
  useServerHas: (feature: string) => serverHas(feature),
}));

const SOURCE = {
  pluginId: 'example-files',
  pluginName: 'Example files',
  sourceId: 'files',
  title: 'Example files',
};

beforeEach(() => {
  fetchMyPermissions
    .mockReset()
    .mockResolvedValue({ permissions: ['sources.play', 'requests.ask'], isAdministrator: false });
  fetchPluginContributions
    .mockReset()
    .mockResolvedValue({ ...somePluginContributions(), sources: [SOURCE] });
  serverHas.mockReset().mockReturnValue(true);
});

describe('useMayStream', () => {
  it('lets somebody play from a source where their role may and a plugin offers one', async () => {
    const { result } = renderHookInACache(() => useMayStream());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('offers nothing to a role that may not ask for films, whose pages it cannot open', async () => {
    fetchMyPermissions.mockResolvedValue({ permissions: ['sources.play'], isAdministrator: false });

    const { result } = renderHookInACache(() => useMayStream());

    await waitFor(() => {
      expect(fetchMyPermissions).toHaveBeenCalled();
    });
    expect(result.current).toBe(false);
    expect(fetchPluginContributions).not.toHaveBeenCalled();
  });

  it('offers nothing where no plugin offers a source', async () => {
    fetchPluginContributions.mockResolvedValue({ ...somePluginContributions(), sources: [] });

    const { result } = renderHookInACache(() => useMayStream());

    await waitFor(() => {
      expect(fetchPluginContributions).toHaveBeenCalled();
    });
    expect(result.current).toBe(false);
  });

  it('offers nothing to a role that may not, nor on a server that does not play from sources', () => {
    fetchMyPermissions.mockResolvedValue({ permissions: [], isAdministrator: false });

    expect(renderHookInACache(() => useMayStream()).result.current).toBe(false);

    serverHas.mockReturnValue(false);
    fetchMyPermissions.mockResolvedValue({ permissions: ['sources.play'], isAdministrator: false });

    expect(renderHookInACache(() => useMayStream()).result.current).toBe(false);
    expect(fetchPluginContributions).not.toHaveBeenCalled();
  });
});
