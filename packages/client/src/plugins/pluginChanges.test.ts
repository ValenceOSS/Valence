import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { actOnPluginSurface } from './actOnPluginSurface';
import { changePlugin } from './changePlugin';
import { installPlugin } from './installPlugin';
import { previewCataloguePlugin } from './previewCataloguePlugin';
import { removePlugin } from './removePlugin';
import { uploadPluginPackage } from './uploadPluginPackage';
import { anInstallPreview } from '@ValenceClient/testing/anInstallPreview';

const fetchMock = vi.fn<(input: string, init?: RequestInit) => Promise<Response>>();

const answer = (body: object | null, status = 200) => {
  fetchMock.mockResolvedValue(
    body === null
      ? new Response(null, { status: 204 })
      : new Response(JSON.stringify(body), { status }),
  );
};

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal('fetch', fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('plugin changes', () => {
  it('sends an action with only its id, payload and the fields', async () => {
    answer({ blocks: [{ type: 'divider' }] });

    const next = await actOnPluginSurface(
      { kind: 'page', pluginId: 'anilist', pageId: 'tracking' },
      {
        action: { id: 'import', payload: { list: 'watching' }, confirm: 'Sure?' },
        fields: { name: 'x', on: true },
      },
    );

    expect(next).toEqual({ kind: 'surface', surface: { blocks: [{ type: 'divider' }] } });
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/plugins/anilist/pages/tracking/act');
    expect(JSON.parse(z.string().parse(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      action: { id: 'import', payload: { list: 'watching' } },
      fields: { name: 'x', on: true },
    });
  });

  it('reads nothing back where the plugin left its page as it was', async () => {
    answer(null);

    await expect(
      actOnPluginSurface(
        { kind: 'page', pluginId: 'anilist', pageId: 'tracking' },
        { action: { id: 'noop' }, fields: {} },
      ),
    ).resolves.toEqual({ kind: 'unchanged' });
  });

  it('follows only this server’s own plugin addresses when told to go somewhere', async () => {
    const place = { kind: 'page', pluginId: 'anilist', pageId: 'tracking' } as const;
    const request = {
      action: { id: 'valence.accounts.connect', payload: { provider: 'anilist' } },
      fields: {},
    };

    answer({ navigate: '/api/plugins/anilist/accounts/anilist/connect' });

    await expect(actOnPluginSurface(place, request)).resolves.toEqual({
      kind: 'navigate',
      to: '/api/plugins/anilist/accounts/anilist/connect',
    });

    answer({ navigate: 'https://evil.example/steal' });

    await expect(actOnPluginSurface(place, request)).rejects.toThrow();

    answer({ navigate: '/api/plugins/anilist//evil.example' });

    await expect(actOnPluginSurface(place, request)).rejects.toThrow();
  });

  it('previews an official plugin', async () => {
    answer(anInstallPreview());

    await expect(previewCataloguePlugin('anilist')).resolves.toEqual(anInstallPreview());
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/plugins/catalogue/anilist/preview');
  });

  it('uploads a package with its signature', async () => {
    answer(anInstallPreview({ trust: 'unsigned', warnings: ['Not signed'] }));

    const preview = await uploadPluginPackage(new Blob(['x']), new Blob(['sig']));
    const form = fetchMock.mock.calls[0]?.[1]?.body;

    expect(preview.trust).toBe('unsigned');
    expect(form instanceof FormData ? [...form.keys()] : []).toEqual(['package', 'signature']);
  });

  it('says why an upload was refused, in the server’s words or its own', async () => {
    answer({ error: 'The package is larger than 8 MB.' }, 400);

    await expect(uploadPluginPackage(new Blob(['x']), null)).rejects.toThrow(
      'The package is larger than 8 MB.',
    );

    fetchMock.mockResolvedValue(new Response('nope', { status: 500 }));

    await expect(uploadPluginPackage(new Blob(['x']), null)).rejects.toThrow(
      'That file could not be read as a plugin.',
    );
  });

  it('installs, changes, removes and disconnects', async () => {
    answer(null);

    await installPlugin({ token: 't', acceptedPermissionsHash: 'h', acceptUnsigned: false });
    await changePlugin('anilist', { isEnabled: false });
    await removePlugin('anilist');

    expect(fetchMock.mock.calls.map(([path, init]) => `${init?.method ?? 'GET'} ${path}`)).toEqual([
      'POST /api/plugins/install',
      'PATCH /api/plugins/anilist',
      'DELETE /api/plugins/anilist',
    ]);
  });
});
