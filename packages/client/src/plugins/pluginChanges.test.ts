import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { actOnPluginSurface } from './actOnPluginSurface';
import { changePlugin } from './changePlugin';
import { chooseHomeRow } from './chooseHomeRow';
import { installPlugin } from './installPlugin';
import { makeAppPassword } from './makeAppPassword';
import { removeAppPassword } from './removeAppPassword';
import { previewCataloguePlugin } from './previewCataloguePlugin';
import { removePlugin } from './removePlugin';
import { rollbackPlugin } from './rollbackPlugin';
import { saveTrustedKeys } from './saveTrustedKeys';
import { uploadPluginPackage } from './uploadPluginPackage';
import { anInstallPreview } from '@ValenceClient/testing/anInstallPreview';
import { aPlugin } from '@ValenceClient/testing/aPlugin';

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
  it('makes an app password with what it is for, and reads its secret back once', async () => {
    const made = {
      address: 'https://valence.test/api/plugins/music/routes',
      password: {
        id: '00000000-0000-4000-8000-000000000001',
        login: 'sam',
        label: 'Phone',
        createdAt: '2026-10-31T10:00:00.000Z',
        lastUsedAt: null,
      },
      secret: 'q8Zr1VbW3nK0yTf6LmP2sXhD',
    };

    answer(made, 201);

    await expect(makeAppPassword('music', 'Phone')).resolves.toEqual(made);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/plugins/music/app-passwords');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST');
    expect(JSON.parse(z.string().parse(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      label: 'Phone',
    });
  });

  it('removes an app password, and says why where the server refused', async () => {
    answer(null);

    await removeAppPassword('music', 'p/1');
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/plugins/music/app-passwords/p%2F1');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('DELETE');

    answer({ error: 'There is no such plugin.' }, 404);

    await expect(removeAppPassword('music', 'p1')).rejects.toThrow('There is no such plugin.');
  });

  it('turns a home row on or off, and says why where the server refused', async () => {
    answer(null);

    await chooseHomeRow('trending', 'hot', true);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/plugins/trending/home-rows/hot');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('PUT');
    expect(fetchMock.mock.calls[0]?.[1]?.body).toBe(JSON.stringify({ isChosen: true }));

    answer({ error: 'There is no such plugin.' }, 404);

    await expect(chooseHomeRow('trending', 'hot', false)).rejects.toThrow(
      'There is no such plugin.',
    );
  });

  it('sends an action with only its id, payload and the fields', async () => {
    answer({ surface: { blocks: [{ type: 'divider' }] }, navigate: null });

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
    answer({ surface: null, navigate: null });

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

    answer({ surface: null, navigate: '/api/plugins/anilist/accounts/anilist/connect' });

    await expect(actOnPluginSurface(place, request)).resolves.toEqual({
      kind: 'navigate',
      to: '/api/plugins/anilist/accounts/anilist/connect',
    });

    answer({ surface: null, navigate: 'https://evil.example/steal' });

    await expect(actOnPluginSurface(place, request)).rejects.toThrow();

    answer({ surface: null, navigate: '/api/plugins/anilist//evil.example' });

    await expect(actOnPluginSurface(place, request)).rejects.toThrow();
  });

  it('rolls a plugin back, and reads the plugin as it now is', async () => {
    answer(aPlugin({ version: '0.9.0' }));

    await expect(rollbackPlugin('anilist')).resolves.toEqual(aPlugin({ version: '0.9.0' }));
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/plugins/anilist/rollback');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('POST');
  });

  it('previews an official plugin', async () => {
    answer(anInstallPreview());

    await expect(previewCataloguePlugin('anilist')).resolves.toEqual(anInstallPreview());
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/plugins/catalogue/anilist/preview');
  });

  it('uploads a package as the body, with its signature beside it', async () => {
    answer(anInstallPreview({ trust: 'unsigned', warnings: ['Not signed'] }));

    const file = new Blob(['x']);
    const preview = await uploadPluginPackage(
      file,
      new Blob(['{"keyId":"k","signature":"YWJj"}\n']),
    );
    const sent = fetchMock.mock.calls[0]?.[1];

    expect(preview.trust).toBe('unsigned');
    expect(sent?.body).toBe(file);
    expect(new Headers(sent?.headers).get('x-valence-signature')).toBe(
      '{"keyId":"k","signature":"YWJj"}',
    );
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

  it('saves the trusted keys whole, and hands back every key the server now trusts', async () => {
    answer({ keys: [{ id: 'home-lab', publicKey: 'PEM', isFromVariable: false }] });

    expect(await saveTrustedKeys([{ id: 'home-lab', publicKey: 'line' }])).toEqual([
      { id: 'home-lab', publicKey: 'PEM', isFromVariable: false },
    ]);
    expect(fetchMock.mock.calls[0]?.[0]).toBe('/api/plugins/trusted-keys');
    expect(fetchMock.mock.calls[0]?.[1]?.method).toBe('PUT');
    expect(JSON.parse(z.string().parse(fetchMock.mock.calls[0]?.[1]?.body))).toEqual({
      keys: [{ id: 'home-lab', publicKey: 'line' }],
    });
  });
});
