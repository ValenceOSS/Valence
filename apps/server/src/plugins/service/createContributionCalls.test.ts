import { describe, expect, it, vi } from 'vitest';
import { SaidError } from '@ValenceI18n/SaidError';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { EXAMPLE_FILES_MANIFEST } from '@ValenceSDK/testing/EXAMPLE_FILES_MANIFEST';
import type { InstalledRecord } from '@ValenceServer/plugins/store/PluginStore';
import { createContributionCalls } from './createContributionCalls';

const RECORD: InstalledRecord = {
  id: 'example-files',
  version: '1.0.0',
  trust: 'unsigned',
  manifest: PluginManifestSchema.parse(EXAMPLE_FILES_MANIFEST),
  packageBase64: '',
  sha256: 'x',
  isEnabled: true,
  settings: {},
  installedBy: null,
  installedAt: '2026-10-27T00:00:00.000Z',
  updatedAt: '2026-10-27T00:00:00.000Z',
  problem: null,
  previousVersion: null,
};

const TITLE = {
  kind: 'film',
  catalogueId: 'tmdb:movie:1',
  tmdbId: '1',
  imdbId: null,
  title: 'A film',
  year: 2001,
} as const;

const build = (answer: (handler: string, args: object) => Promise<string>, record = RECORD) => {
  const invoke = vi.fn((_plugin: object, handler: string, args: object) => answer(handler, args));

  return {
    invoke,
    calls: createContributionCalls({
      runnable: (pluginId) =>
        Promise.resolve(pluginId === record.id ? { record, code: 'x' } : null),
      invoke,
    }),
  };
};

const problemOf = async (promise: Promise<object | void>): Promise<string> => {
  try {
    await promise;

    return 'none';
  } catch (error) {
    return error instanceof SaidError ? (error.said.code ?? error.said.message) : 'other';
  }
};

describe('asking a plugin’s download client or source', () => {
  it('runs the handler for the contribution asked of, and reads the answer as the SDK says', async () => {
    const { calls, invoke } = build(() => Promise.resolve('{"id":"7"}'));

    expect(
      await calls.downloadClient('example-files', 'files').add({
        kind: 'nzb',
        title: 'Film',
        nzbBase64: 'PG56Yi8+',
      }),
    ).toEqual({ id: '7' });
    expect(invoke).toHaveBeenCalledWith(expect.anything(), 'downloadClient.add', {
      id: 'files',
      ask: { kind: 'nzb', title: 'Film', nzbBase64: 'PG56Yi8+' },
    });
  });

  it('refuses a plugin that is off or gone, and a contribution it does not declare', async () => {
    const { calls } = build(() => Promise.resolve('null'));

    expect(await problemOf(calls.downloadClient('gone', 'files').test())).toBe(
      'server.service.contributionCalls.namePluginIsOffOrGone',
    );
    expect(
      await problemOf(
        calls.source('example-files', 'other').streams({ title: TITLE, candidates: [] }),
      ),
    ).toBe('server.service.contributionCalls.nameOffersNothingCalledId');
  });

  it('refuses an answer that does not read as it should', async () => {
    const { calls } = build(() => Promise.resolve('{"streams":"lots"}'));

    expect(
      await problemOf(
        calls.source('example-files', 'files').streams({ title: TITLE, candidates: [] }),
      ),
    ).toBe('server.service.contributionCalls.nameAnsweredSomethingValenceCouldNot');
  });

  it('passes on what the plugin said when it threw, and calls a silent failure not answering', async () => {
    const said = build(() => Promise.reject(new SaidError(sayVerbatim('The service is down.'))));
    const silent = build(() => Promise.reject(new Error('The plugin took too long to answer.')));

    expect(await problemOf(said.calls.downloadClient('example-files', 'files').test())).toBe(
      'The service is down.',
    );
    expect(await problemOf(silent.calls.downloadClient('example-files', 'files').test())).toBe(
      'server.service.pluginService.nameIsNotAnswering',
    );
  });

  it('accepts links only to the hosts the plugin listed', async () => {
    const files = (url: string) =>
      build(() =>
        Promise.resolve(JSON.stringify({ files: [{ name: 'film.mkv', sizeBytes: 1, url }] })),
      )
        .calls.downloadClient('example-files', 'files')
        .files({ id: '7' });
    const resolve = (url: string) =>
      build(() =>
        Promise.resolve(JSON.stringify({ kind: 'ready', url, fileName: 'film.mkv', sizeBytes: 1 })),
      )
        .calls.source('example-files', 'files')
        .resolve({
          title: TITLE,
          stream: { key: 'a', name: 'Film', infoHash: null, fileName: null },
        });

    expect(await problemOf(files('https://eu1.files.example.test/f/1'))).toBe('none');
    expect(await problemOf(files('https://elsewhere.example.com/f/1'))).toBe(
      'server.service.contributionCalls.nameSentALinkToHost',
    );
    expect(await problemOf(resolve('https://files.example.test/f/1'))).toBe(
      'server.service.contributionCalls.nameSentALinkToHost',
    );
    expect(await problemOf(resolve('https://eu1.files.example.test/f/1'))).toBe('none');
  });

  it('says which hosts a plugin hands over files from', async () => {
    const { calls } = build(() => Promise.resolve('null'));

    expect(await calls.linkHostsOf('example-files')).toEqual(['*.files.example.test']);
    expect(await calls.linkHostsOf('gone')).toEqual([]);
  });

  it('removes a download, which answers nothing', async () => {
    const { calls } = build(() => Promise.resolve('null'));

    await expect(
      calls.downloadClient('example-files', 'files').remove({ id: '7' }),
    ).resolves.toBeUndefined();
  });
});
