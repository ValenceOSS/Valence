import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { PluginCallMethod } from '@ValenceContracts/schemas/PluginCall';
import { DownloadClientFailure } from '@ValenceRequests/downloads/DownloadClientFailure';
import { aDownloadClient } from '@ValenceRequests/testing/aDownloadClient';
import { createPluginAdapter } from './createPluginAdapter';
import type { SentToPlugin } from './createPluginAdapter';
import type { FetchJob, FetchState, LinkFetcher } from './createLinkFetcher';

type Answer = (method: PluginCallMethod, ask: JsonValue) => JsonValue;

const SENT: SentToPlugin = {
  remoteId: '7',
  title: 'Film: The Sequel (2001)',
  libraryKind: 'movies',
};

let folder = '';

beforeEach(async () => {
  folder = await mkdtemp(join(tmpdir(), 'plugin-adapter-'));
});

/**
 * A fetcher that remembers what it was asked to copy and reports whatever state a test sets.
 *
 * @returns The fetcher, what it started, and how to set a state.
 */
const aFetcher = () => {
  const states = new Map<string, FetchState>();
  const started = new Map<string, FetchJob>();
  const fetcher: LinkFetcher = {
    start: (key, job) => {
      started.set(key, job);
      states.set(key, { phase: 'waiting', doneBytes: 0, totalBytes: null });
    },
    stateOf: (key) => states.get(key) ?? null,
    forget: (key) => {
      states.delete(key);
    },
  };

  return { fetcher, started, states };
};

const build = (answer: Answer, sent: SentToPlugin[] = [SENT]) => {
  const call = vi.fn((_plugin: string, _client: string, method: PluginCallMethod, ask: JsonValue) =>
    Promise.resolve({ value: answer(method, ask), linkHosts: ['*.files.example.test'] }),
  );
  const { fetcher, started, states } = aFetcher();
  const adapter = createPluginAdapter({
    client: aDownloadClient({
      name: 'Example files',
      kind: 'plugin',
      url: '',
      localPath: folder,
      plugin: { id: 'example-files', clientId: 'files', protocol: 'torrent' },
    }),
    channel: { call },
    fetcher,
    sent: () => Promise.resolve(sent),
  });

  return { adapter, call, started, states };
};

const statusOf = (state: string, progress: number): JsonValue => ({
  items: [{ id: '7', state, progress, sizeBytes: 100, doneBytes: progress * 100 }],
});

const problemOf = async (promise: Promise<object | string | void>): Promise<string> => {
  try {
    await promise;

    return 'none';
  } catch (error) {
    return error instanceof DownloadClientFailure ? (error.said.code ?? '') : 'other';
  }
};

describe('a download client a plugin provides', () => {
  it('hands the plugin a magnet with its hash, and keeps the id it answers', async () => {
    const hash = 'c12fe1c06bba254a9dc9f519b335aa7c1367a88a';
    const { adapter, call } = build(() => ({ id: '7' }));

    expect(
      await adapter.add({ kind: 'magnet', url: `magnet:?xt=urn:btih:${hash}` }, 'Film', 'films'),
    ).toBe('7');
    expect(call).toHaveBeenCalledWith('example-files', 'files', 'add', {
      kind: 'magnet',
      title: 'Film',
      magnet: `magnet:?xt=urn:btih:${hash}`,
      infoHash: hash,
    });
  });

  it('puts a refusal into Valence’s words, naming the client', async () => {
    const { adapter } = build(() => ({ refused: { reason: 'limitReached' } }));

    expect(
      await problemOf(adapter.add({ kind: 'nzb', bytes: new Uint8Array([1]) }, 'Film', 'films')),
    ).toBe('requests.downloads.pluginAdapter.clientSaysTheAccountHasReached');
  });

  it('refuses an answer that does not read as the SDK says', async () => {
    const { adapter } = build(() => ({ version: 7 }));

    expect(await problemOf(adapter.version())).toBe(
      'server.service.contributionCalls.nameAnsweredSomethingValenceCouldNot',
    );
  });

  it('reports a download still at the service as such', async () => {
    const { adapter } = build(() => statusOf('downloading', 0.25));

    expect(await adapter.list()).toMatchObject([
      { remoteId: '7', state: 'downloading', phase: 'remote', progress: 0.25, doneBytes: 25 },
    ]);
  });

  it('waits a round once the service is done, then copies it under its category', async () => {
    const { adapter, started, states } = build((method) =>
      method === 'status'
        ? statusOf('done', 1)
        : {
            files: [{ name: 'film.mkv', sizeBytes: 100, url: 'https://eu1.files.example.test/f' }],
          },
    );

    expect(await adapter.list()).toMatchObject([{ state: 'queued', phase: 'local', progress: 0 }]);
    expect(started.size).toBe(0);

    await adapter.list();

    const job = started.get('7');

    expect(job?.folder).toBe(join(folder, 'valence-films', 'Film - The Sequel (2001)'));
    expect(await job?.files()).toEqual({
      files: [{ name: 'film.mkv', sizeBytes: 100, url: 'https://eu1.files.example.test/f' }],
      linkHosts: ['*.files.example.test'],
    });

    states.set('7', { phase: 'fetching', doneBytes: 40, totalBytes: 100, bytesPerSecond: 20 });
    expect(await adapter.list()).toMatchObject([
      {
        state: 'downloading',
        phase: 'local',
        progress: 0.4,
        secondsLeft: 3,
        downloadBytesPerSecond: 20,
      },
    ]);

    states.set('7', { phase: 'done', path: '/downloads/films/Film', totalBytes: 100 });
    expect(await adapter.list()).toMatchObject([
      { state: 'done', phase: null, progress: 1, path: '/downloads/films/Film' },
    ]);
  });

  it('leaves out files the queue skipped when it copies', async () => {
    const files = [
      { name: 'film.mkv', sizeBytes: 100, url: 'https://eu1.files.example.test/a' },
      { name: 'setup.exe', sizeBytes: 1, url: 'https://eu1.files.example.test/b' },
    ];
    const { adapter, started } = build((method) =>
      method === 'status' ? statusOf('done', 1) : { files },
    );

    expect(await adapter.files?.('7')).toEqual([
      { index: 0, name: 'film.mkv' },
      { index: 1, name: 'setup.exe' },
    ]);
    await adapter.skip?.('7', [1]);
    await adapter.list();
    await adapter.list();
    expect((await started.get('7')?.files())?.files).toEqual([files[0]]);
  });

  it('reports a copy that failed, and one the service failed', async () => {
    const failing = build(() => ({
      items: [{ id: '7', state: 'failed', progress: 0, failure: { reason: 'tooBig' } }],
    }));
    const copying = build(() => statusOf('done', 1));

    copying.states.set('7', {
      phase: 'failed',
      problem: { code: 'x', message: 'Copy failed.', values: {} },
    });

    expect(await failing.adapter.list()).toMatchObject([
      {
        state: 'failed',
        problem: { code: 'requests.downloads.pluginAdapter.itIsBiggerThanClientWill' },
      },
    ]);
    expect(await copying.adapter.list()).toMatchObject([
      { state: 'failed', phase: 'local', problem: { message: 'Copy failed.' } },
    ]);
  });

  it('asks about downloads in batches of as many as the SDK allows', async () => {
    const many = Array.from({ length: 201 }, (_unused, at) => ({
      ...SENT,
      remoteId: at.toString(),
    }));
    const { adapter, call } = build(() => ({ items: [] }), many);

    expect(await adapter.list()).toEqual([]);
    expect(call.mock.calls.map(([, , , ask]) => ask)).toEqual([
      { ids: many.slice(0, 200).map((one) => one.remoteId) },
      { ids: ['200'] },
    ]);
  });

  it('cannot pause, and removes a download with its copy here', async () => {
    const { adapter, call } = build((method) => (method === 'remove' ? null : statusOf('done', 1)));

    expect(await problemOf(adapter.pause('7'))).toBe(
      'requests.downloads.pluginAdapter.clientCannotPauseADownload',
    );
    await adapter.remove('7', true);
    expect(call).toHaveBeenLastCalledWith('example-files', 'files', 'remove', { id: '7' });
    await expect(readFile(join(folder, 'valence-films'))).rejects.toThrow();
  });
});
