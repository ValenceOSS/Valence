import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import type { IncomingMessage, Server, ServerResponse } from 'node:http';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { openPinnedRequest } from '@ValenceCore/network/openPinnedRequest';
import { createLinkFetcher } from './createLinkFetcher';
import type { FetchState, LinkedFiles } from './createLinkFetcher';

type Handler = (asked: IncomingMessage, answer: ServerResponse) => void;

const FILES: Record<string, string> = { '/a': 'abcdefghij', '/b': '0123' };

let server: Server;
let port = 0;
let folder = '';
let handle: Handler;
let asked: { path: string; range: string | null }[] = [];

/**
 * Serves the test's files as a file service would, ranges and all.
 *
 * @param request - What was asked.
 * @param answer - Where to answer.
 */
const serveRanges: Handler = (request, answer) => {
  const body = FILES[request.url ?? ''];

  if (body === undefined) {
    answer.writeHead(404);
    answer.end();

    return;
  }

  const from = Number(/^bytes=(\d+)-$/.exec(request.headers.range ?? '')?.[1] ?? 0);

  answer.writeHead(
    from > 0 ? 206 : 200,
    from > 0
      ? {
          'content-range': `bytes ${from.toString()}-${(body.length - 1).toString()}/${body.length.toString()}`,
        }
      : {},
  );
  answer.end(body.slice(from));
};

beforeEach(async () => {
  folder = await mkdtemp(join(tmpdir(), 'link-fetcher-'));
  asked = [];
  handle = serveRanges;
  server = createServer((request, answer) => {
    asked.push({ path: request.url ?? '', range: request.headers.range ?? null });
    handle(request, answer);
  });
  await new Promise<void>((ready) => {
    server.listen(0, '127.0.0.1', () => {
      ready();
    });
  });

  const address = server.address();

  port = typeof address === 'object' && address !== null ? address.port : 0;
});

afterEach(async () => {
  server.closeAllConnections();
  await new Promise<void>((done) => {
    server.close(() => {
      done();
    });
  });
});

const fetcherFor = (changes: Parameters<typeof createLinkFetcher>[0] = {}) =>
  createLinkFetcher({
    open: (address, init, hosts, signal) =>
      openPinnedRequest(address, init, {
        hosts,
        userAgent: 'test',
        devHosts: new Map([
          ['eu1.files.example.test', { address: '127.0.0.1', port }],
          ['elsewhere.example.com', { address: '127.0.0.1', port }],
        ]),
        signal,
      }),
    freeBytesOf: () => Promise.resolve(1_000_000),
    ...changes,
  });

const linked = (
  names: Record<string, string> = { 'Film/a.mkv': '/a', 'Film/b.srt': '/b' },
): LinkedFiles => ({
  files: Object.entries(names).map(([name, path]) => ({
    name,
    sizeBytes: (FILES[path] ?? 'xxxxxxxx').length,
    url: `https://eu1.files.example.test${path}`,
  })),
  linkHosts: ['*.files.example.test'],
});

const settled = async (
  fetcher: ReturnType<typeof createLinkFetcher>,
  key: string,
): Promise<FetchState | null> => {
  await vi.waitFor(() => {
    expect(['done', 'failed']).toContain(fetcher.stateOf(key)?.phase);
  });

  return fetcher.stateOf(key);
};

describe('copying a plugin download’s files to this server', () => {
  it('downloads every file into its folder and says where they are', async () => {
    const fetcher = fetcherFor();

    fetcher.start('one', { folder, files: () => Promise.resolve(linked()) });

    expect(await settled(fetcher, 'one')).toEqual({ phase: 'done', path: folder, totalBytes: 14 });
    expect(await readFile(join(folder, 'Film/a.mkv'), 'utf8')).toBe('abcdefghij');
    expect(await readFile(join(folder, 'Film/b.srt'), 'utf8')).toBe('0123');
  });

  it('carries on from a file part-way through, and skips one already whole', async () => {
    await writeFile(join(folder, 'a.mkv.part'), 'abcd');
    await writeFile(join(folder, 'b.srt'), '0123');

    const fetcher = fetcherFor();

    fetcher.start('one', {
      folder,
      files: () => Promise.resolve(linked({ 'a.mkv': '/a', 'b.srt': '/b' })),
    });

    expect((await settled(fetcher, 'one'))?.phase).toBe('done');
    expect(await readFile(join(folder, 'a.mkv'), 'utf8')).toBe('abcdefghij');
    expect(asked).toEqual([{ path: '/a', range: 'bytes=4-' }]);
  });

  it('asks the plugin for the links again once when one has expired', async () => {
    let isExpired = true;

    handle = (request, answer) => {
      if (isExpired) {
        isExpired = false;
        answer.writeHead(410);
        answer.end();

        return;
      }

      serveRanges(request, answer);
    };

    const files = vi.fn(() => Promise.resolve(linked({ 'a.mkv': '/a' })));
    const fetcher = fetcherFor();

    fetcher.start('one', { folder, files });

    expect((await settled(fetcher, 'one'))?.phase).toBe('done');
    expect(files).toHaveBeenCalledTimes(2);
  });

  it('fails a file that turns out bigger than the plugin said', async () => {
    const fetcher = fetcherFor();
    const small = linked({ 'a.mkv': '/a' });

    fetcher.start('one', {
      folder,
      files: () =>
        Promise.resolve({
          ...small,
          files: small.files.map((file) => ({ ...file, sizeBytes: 3 })),
        }),
    });

    expect(await settled(fetcher, 'one')).toMatchObject({
      phase: 'failed',
      problem: { code: 'requests.downloads.linkFetcher.nameWasNotTheSizeThe' },
    });
  });

  it('fails before downloading anything that would not fit', async () => {
    const fetcher = fetcherFor({ freeBytesOf: () => Promise.resolve(5) });

    fetcher.start('one', { folder, files: () => Promise.resolve(linked()) });

    expect(await settled(fetcher, 'one')).toMatchObject({
      phase: 'failed',
      problem: { code: 'requests.downloads.linkFetcher.thereIsNotRoomInFolder' },
    });
    expect(asked).toEqual([]);
  });

  it('refuses a link to a host the plugin did not list', async () => {
    const fetcher = fetcherFor();

    fetcher.start('one', {
      folder,
      files: () =>
        Promise.resolve({
          files: [{ name: 'a.mkv', sizeBytes: 10, url: 'https://elsewhere.example.com/a' }],
          linkHosts: ['*.files.example.test'],
        }),
    });

    expect(await settled(fetcher, 'one')).toMatchObject({
      phase: 'failed',
      problem: { code: 'requests.downloads.linkFetcher.aLinkWentToHostWhich' },
    });
  });

  it('runs only so many at once, and lets go of one it is told to forget', async () => {
    handle = () => undefined;

    const fetcher = fetcherFor({ atOnce: 1 });

    fetcher.start('one', { folder: join(folder, 'one'), files: () => Promise.resolve(linked()) });
    fetcher.start('two', { folder: join(folder, 'two'), files: () => Promise.resolve(linked()) });

    await vi.waitFor(() => {
      expect(fetcher.stateOf('one')?.phase).toBe('fetching');
    });
    expect(fetcher.stateOf('two')?.phase).toBe('waiting');

    handle = serveRanges;
    fetcher.forget('one');

    expect(fetcher.stateOf('one')).toBeNull();
    expect((await settled(fetcher, 'two'))?.phase).toBe('done');
  });
});
