import { describe, expect, it, vi } from 'vitest';
import { SaidError } from '@ValenceI18n/SaidError';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { PluginDownloadClient } from '@ValenceServer/plugins/service/createContributionCalls';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import { answerPluginCall } from './answerPluginCall';

const aClient = (): PluginDownloadClient => ({
  test: vi.fn(() => Promise.resolve({ version: '1.0', note: null })),
  add: vi.fn(() => Promise.resolve({ id: '7' })),
  status: vi.fn(() => Promise.resolve({ items: [] })),
  files: vi.fn(() => Promise.resolve({ files: [] })),
  remove: vi.fn(() => Promise.resolve()),
});

const callOf = (method: 'test' | 'add' | 'status' | 'files' | 'remove', ask: JsonValue) => ({
  id: '6f1c3c43-3a8e-4f5b-9f39-2f9f0d6c1a11',
  pluginId: 'example-files',
  clientId: 'files',
  method,
  ask,
});

describe('answering a plugin call from the requests service', () => {
  it('asks the plugin’s download client, and says where its links may come from', async () => {
    const client = aClient();
    const plugins = {
      downloadClient: vi.fn(() => client),
      linkHostsOf: vi.fn(() => Promise.resolve(['*.files.example.test'])),
    };

    expect(await answerPluginCall(callOf('status', { ids: ['7'] }), plugins)).toEqual({
      ok: true,
      value: { items: [] },
      linkHosts: ['*.files.example.test'],
    });
    expect(plugins.downloadClient).toHaveBeenCalledWith('example-files', 'files');
    expect(client.status).toHaveBeenCalledWith({ ids: ['7'] });
    expect(await answerPluginCall(callOf('remove', { id: '7' }), plugins)).toMatchObject({
      ok: true,
      value: null,
    });
  });

  it('answers what went wrong, in words', async () => {
    const client = aClient();

    client.test = () => Promise.reject(new SaidError(sayVerbatim('Down.')));

    const plugins = { downloadClient: () => client, linkHostsOf: () => Promise.resolve([]) };

    expect(await answerPluginCall(callOf('test', {}), plugins)).toEqual({
      ok: false,
      problem: sayVerbatim('Down.'),
    });
    expect(await answerPluginCall(callOf('add', { kind: 'nonsense' }), plugins)).toMatchObject({
      ok: false,
      problem: { code: 'common.theClientCouldNotBeAsked' },
    });
  });
});
