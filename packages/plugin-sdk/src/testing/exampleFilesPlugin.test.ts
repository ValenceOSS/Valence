import { mkdtemp, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { FilesAnswerSchema } from '@ValenceSDK/downloadClients/FilesAnswerSchema';
import { ResolveAnswerSchema } from '@ValenceSDK/sources/ResolveAnswerSchema';
import { StatusAnswerSchema } from '@ValenceSDK/downloadClients/StatusAnswerSchema';
import { StreamsAnswerSchema } from '@ValenceSDK/sources/StreamsAnswerSchema';
import type { HandlerContext } from '@ValenceSDK/host/PluginDefinition';
import { aValenceHost } from './aValenceHost';
import { EXAMPLE_FILES_MANIFEST } from './EXAMPLE_FILES_MANIFEST';
import { exampleFilesPlugin } from './exampleFilesPlugin';
import { startExampleFileService } from './startExampleFileService';
import type { ExampleFileService } from './startExampleFileService';

const READY = 'a'.repeat(40);

const SLOW = 'b'.repeat(40);

const UNKNOWN = 'c'.repeat(40);

const TITLE = {
  kind: 'film',
  catalogueId: 'tmdb:movie:1',
  tmdbId: '1',
  imdbId: null,
  title: 'A film',
  year: 2001,
} as const;

let service: ExampleFileService;
let clock = 0;
let context: HandlerContext;

beforeEach(async () => {
  const folder = await mkdtemp(join(tmpdir(), 'example-files-'));
  const film = join(folder, 'film.mkv');

  await writeFile(film, '0123456789');
  clock = 1_000_000;
  service = await startExampleFileService({
    entries: [
      {
        infoHash: READY,
        name: 'Film.2001.1080p',
        tmdbId: '1',
        files: [{ name: 'film.mkv', path: film }],
        isReady: true,
      },
      {
        infoHash: SLOW,
        name: 'Film.2001.720p',
        files: [{ name: 'film.mkv', path: film }],
        isReady: false,
        prepareSeconds: 10,
      },
    ],
    key: 'secret',
    publicOrigin: 'https://eu1.files.example.test',
    now: () => clock,
  });
  context = {
    valence: aValenceHost({
      settings: { read: () => Promise.resolve({ apiKey: 'secret' }) },
      http: {
        fetch: async (url, init = {}) => {
          const answer = await fetch(
            url.replace('https://api.files.example.test', service.origin),
            {
              method: init.method ?? 'GET',
              headers: init.headers ?? {},
              ...(init.body === undefined ? {} : { body: init.body }),
            },
          );

          return { status: answer.status, headers: {}, text: await answer.text() };
        },
      },
    }),
  };
});

afterEach(async () => {
  await service.stop();
});

const client = () => {
  const found = exampleFilesPlugin.downloadClients?.['files'];

  if (found === undefined) {
    throw new Error('The example has no download client.');
  }

  return found;
};

const source = () => {
  const found = exampleFilesPlugin.sources?.['files'];

  if (found === undefined) {
    throw new Error('The example has no source.');
  }

  return found;
};

describe('the example file service plugin', () => {
  it('has a manifest that passes every rule', () => {
    expect(PluginManifestSchema.safeParse(EXAMPLE_FILES_MANIFEST).success).toBe(true);
  });

  it('tests its connection, and says when its key is wrong', async () => {
    expect(await client().test(context)).toEqual({ version: '1.0' });

    const wrong = {
      valence: aValenceHost({
        settings: { read: () => Promise.resolve({ apiKey: 'wrong' }) },
        http: context.valence.http,
      }),
    };

    expect(await client().test(wrong)).toEqual({ refused: { reason: 'notSetUp' } });
  });

  it('takes a download, reports its progress, and hands over its files', async () => {
    const added = await client().add(context, {
      kind: 'magnet',
      title: 'Film.2001.720p',
      magnet: `magnet:?xt=urn:btih:${SLOW}`,
      infoHash: SLOW,
    });

    if (!('id' in added)) {
      throw new Error('It was not added.');
    }

    clock += 5_000;

    expect(
      StatusAnswerSchema.parse(await client().status(context, { ids: [added.id] })).items,
    ).toMatchObject([{ id: added.id, state: 'downloading', progress: 0.5 }]);
    expect(FilesAnswerSchema.parse(await client().files(context, { id: added.id }))).toEqual({
      refused: { reason: 'notReady', message: null },
    });

    clock += 5_000;

    expect(FilesAnswerSchema.parse(await client().files(context, { id: added.id }))).toMatchObject({
      files: [{ name: 'film.mkv', sizeBytes: 10 }],
    });
    await client().remove(context, { id: added.id });
    expect(
      StatusAnswerSchema.parse(await client().status(context, { ids: [added.id] })).items,
    ).toEqual([]);
  });

  it('lists streams from the candidates it is handed and from what it holds itself', async () => {
    const answer = StreamsAnswerSchema.parse(
      await source().streams(context, {
        title: TITLE,
        candidates: [
          { infoHash: SLOW, name: 'Film.2001.720p', sizeBytes: 10, seeders: 4 },
          { infoHash: UNKNOWN, name: 'Film.2001.480p', sizeBytes: null, seeders: null },
        ],
      }),
    );

    expect(answer.streams.map((stream) => [stream.key, stream.isReady])).toEqual([
      [SLOW, false],
      [UNKNOWN, false],
      [READY, true],
    ]);
  });

  it('resolves a ready stream to a link, prepares one that is not, and refuses one it lacks', async () => {
    const resolve = (key: string) =>
      source()
        .resolve(context, {
          title: TITLE,
          stream: { key, name: 'Film', infoHash: key, fileName: null },
        })
        .then((answer) => ResolveAnswerSchema.parse(answer));

    expect(await resolve(READY)).toMatchObject({
      kind: 'ready',
      fileName: 'film.mkv',
      sizeBytes: 10,
    });
    expect(await resolve(SLOW)).toEqual({ kind: 'preparing', progress: 0 });
    expect(await resolve(UNKNOWN)).toEqual({
      kind: 'refused',
      reason: 'unavailable',
      message: null,
    });
  });
});
