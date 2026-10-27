import { z } from 'zod';
import type { PluginDefinition } from '@ValenceSDK/host/PluginDefinition';
import type { ValenceHost } from '@ValenceSDK/host/ValenceHost';
import { REMOTE_REFUSAL_REASONS } from '@ValenceSDK/remoteFiles/REMOTE_REFUSAL_REASONS';

const API = 'https://api.files.example.test/v1';

const ErrorSchema = z.object({ error: z.enum(REMOTE_REFUSAL_REASONS).catch('failed') });

const ItemsSchema = z.object({
  items: z.array(
    z.object({
      id: z.string(),
      state: z.enum(['downloading', 'done', 'failed']),
      progress: z.number(),
      sizeBytes: z.number(),
      doneBytes: z.number(),
      error: z.enum(REMOTE_REFUSAL_REASONS).nullable(),
    }),
  ),
});

const FilesSchema = z.object({
  files: z.array(z.object({ name: z.string(), sizeBytes: z.number(), url: z.string() })),
});

const SearchSchema = z.object({
  results: z.array(
    z.object({
      infoHash: z.string(),
      name: z.string(),
      sizeBytes: z.number(),
      isReady: z.boolean(),
    }),
  ),
});

const LinkSchema = z.object({
  url: z.string(),
  fileName: z.string(),
  sizeBytes: z.number(),
  expiresAt: z.string(),
});

/**
 * Asks the example file service something, signed with the key the administrator gave the plugin.
 *
 * @param valence - The host.
 * @param path - What to ask, after the API's address.
 * @param body - What to send, where anything is.
 * @param method - How to ask, which is a GET or, with a body, a POST unless said otherwise.
 * @returns The status and the answer as JSON, or null where there was none.
 */
const ask = async (
  valence: ValenceHost,
  path: string,
  body?: object,
  method: 'GET' | 'POST' | 'DELETE' = body === undefined ? 'GET' : 'POST',
) => {
  const settings = await valence.settings.read();
  const key = settings['apiKey'];
  const answer = await valence.http.fetch(`${API}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${typeof key === 'string' ? key : ''}`,
      'content-type': 'application/json',
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const parsed: object | null =
    answer.text === '' ? null : z.looseObject({}).parse(JSON.parse(answer.text));

  return { status: answer.status, json: parsed };
};

/**
 * Turns what the service said when it would not do something into the reason Valence understands.
 *
 * @param answered - What it said.
 * @returns The reason.
 */
const reasonOf = (answered: {
  status: number;
  json: object | null;
}): (typeof REMOTE_REFUSAL_REASONS)[number] =>
  answered.status === 401 ? 'notSetUp' : ErrorSchema.parse(answered.json ?? {}).error;

const exampleFilesPlugin: PluginDefinition = {
  downloadClients: {
    files: {
      test: async ({ valence }) => {
        const answered = await ask(valence, '/account');

        if (answered.status !== 200) {
          return { refused: { reason: reasonOf(answered) } };
        }

        return { version: z.object({ version: z.string() }).parse(answered.json).version };
      },
      add: async ({ valence }, release) => {
        if (release.kind === 'nzb' || release.infoHash === null) {
          throw new Error('Only a torrent whose info hash is known can be sent here.');
        }

        const answered = await ask(valence, '/items', { infoHash: release.infoHash });

        if (answered.status !== 201) {
          return { refused: { reason: reasonOf(answered) } };
        }

        return { id: z.object({ id: z.string() }).parse(answered.json).id };
      },
      status: async ({ valence }, { ids }) => {
        const answered = await ask(valence, `/items?ids=${ids.map(encodeURIComponent).join(',')}`);

        return {
          items: ItemsSchema.parse(answered.json).items.map((item) => ({
            id: item.id,
            state: item.state,
            progress: item.progress,
            sizeBytes: item.sizeBytes,
            doneBytes: item.doneBytes,
            failure: item.error === null ? null : { reason: item.error },
          })),
        };
      },
      files: async ({ valence }, { id }) => {
        const answered = await ask(valence, `/items/${encodeURIComponent(id)}/files`);

        if (answered.status !== 200) {
          return { refused: { reason: reasonOf(answered) } };
        }

        return FilesSchema.parse(answered.json);
      },
      remove: async ({ valence }, { id }) => {
        await ask(valence, `/items/${encodeURIComponent(id)}`, undefined, 'DELETE');
      },
    },
  },
  sources: {
    files: {
      streams: async ({ valence }, { title, candidates }) => {
        const ready = await ask(valence, '/ready', {
          hashes: candidates.map((candidate) => candidate.infoHash),
        });
        const isReady = new Set(
          z
            .object({ ready: z.array(z.string()) })
            .catch({ ready: [] })
            .parse(ready.json).ready,
        );
        const search = [
          ...(title.tmdbId === null ? [] : [`tmdb=${encodeURIComponent(title.tmdbId)}`]),
          ...(title.imdbId === null ? [] : [`imdb=${encodeURIComponent(title.imdbId)}`]),
        ].join('&');
        const held = SearchSchema.catch({ results: [] }).parse(
          (await ask(valence, `/search?${search}`)).json,
        ).results;
        const offered = new Set(candidates.map((candidate) => candidate.infoHash));

        return {
          streams: [
            ...candidates.map((candidate) => ({
              key: candidate.infoHash,
              name: candidate.name,
              infoHash: candidate.infoHash,
              isReady: isReady.has(candidate.infoHash),
              sizeBytes: candidate.sizeBytes,
            })),
            ...held
              .filter((each) => !offered.has(each.infoHash))
              .map((each) => ({
                key: each.infoHash,
                name: each.name,
                infoHash: each.infoHash,
                isReady: each.isReady,
                sizeBytes: each.sizeBytes,
              })),
          ],
        };
      },
      resolve: async ({ valence }, { stream }) => {
        const answered = await ask(valence, '/links', {
          infoHash: stream.key,
          ...(stream.fileName === null ? {} : { fileName: stream.fileName }),
        });

        if (answered.status === 202) {
          return {
            kind: 'preparing',
            progress: z.object({ progress: z.number() }).parse(answered.json).progress,
          };
        }

        if (answered.status !== 200) {
          return { kind: 'refused', reason: reasonOf(answered) };
        }

        return { kind: 'ready', ...LinkSchema.parse(answered.json) };
      },
    },
  },
};

export { exampleFilesPlugin };
