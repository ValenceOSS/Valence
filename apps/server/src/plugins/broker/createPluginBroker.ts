import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { Permission } from '@ValenceSDK/manifest/PermissionSchema';
import type { PluginFetch } from '@ValenceServer/plugins/network/createPluginFetch';
import type { InstalledRecord, PluginStore } from '@ValenceServer/plugins/store/PluginStore';
import type { BrokerScope } from './BrokerScope';
import type { PluginHost } from './PluginHost';

type AccountTokens = { accessToken: string; expiresAt: string | null; account: string | null };

type CreatePluginBrokerOptions = {
  installation: Pick<InstalledRecord, 'id' | 'manifest' | 'settings'>;
  store: PluginStore;
  host: PluginHost;
  fetch: PluginFetch;
  tokensFor: (profileId: string, provider: string) => Promise<AccountTokens | null>;
  log: (level: 'info' | 'warn' | 'error', message: string) => void;
};

type PluginBroker = (method: string, args: string, scope: BrokerScope | null) => Promise<string>;

const Id = z.string().min(1).max(200);

const Key = z.string().min(1).max(200);

const MediaKind = z.enum(['film', 'series', 'episode', 'album', 'track', 'book']);

const CatalogueKind = z.enum(['film', 'series', 'album', 'track']);

const ExternalSource = z.enum(['tmdb', 'tvdb', 'imdb', 'anilist', 'mal', 'musicbrainz', 'isrc']);

const Moment = z.iso.datetime({ offset: true });

const Detail = z.record(
  z.string().max(60),
  z.union([z.string().max(500), z.number(), z.boolean(), z.null()]),
);

const FetchInit = z
  .object({
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
    headers: z.record(z.string().max(100), z.string().max(8000)).optional(),
    body: z.string().max(1_000_000).optional(),
  })
  .optional();

const ARGS = {
  'settings.read': z.tuple([]),
  'log.info': z.tuple([z.string().max(2000)]).rest(Detail),
  'log.warn': z.tuple([z.string().max(2000)]).rest(Detail),
  'log.error': z.tuple([z.string().max(2000)]).rest(Detail),
  'storage.get': z.tuple([Key]),
  'storage.set': z.tuple([Key, JsonValueSchema]),
  'storage.delete': z.tuple([Key]),
  'storage.keys': z.tuple([z.string().max(200).optional()]),
  'events.emit': z.tuple([z.string().regex(/^[a-z][a-z0-9-]{0,39}$/), Detail.optional()]),
  'crypto.hmac': z.tuple([
    z.enum(['sha1', 'sha256', 'sha512']),
    z.string().max(4096),
    z.string().max(1_000_000),
    z.enum(['hex', 'base64']).optional(),
  ]),
  'crypto.equal': z.tuple([z.string().max(4096), z.string().max(4096)]),
  'http.fetch': z.tuple([z.string().max(2000), FetchInit]),
  'accounts.connection': z.tuple([Id, Id]),
  'accounts.disconnect': z.tuple([Id, Id]),
  'profiles.list': z.tuple([]),
  'library.get': z.tuple([Id]),
  'library.search': z.tuple([z.string().min(1).max(200), z.array(MediaKind).max(6).optional()]),
  'library.findByExternalId': z.tuple([ExternalSource, z.string().min(1).max(100)]),
  'library.episodes': z.tuple([Id]),
  'viewing.progress': z.tuple([Id, Moment.optional()]),
  'viewing.markWatched': z.tuple([Id, Id, Moment.optional()]),
  'viewing.markUnwatched': z.tuple([Id, Id]),
  'requests.searchCatalogue': z.tuple([z.string().min(1).max(200), CatalogueKind]),
  'requests.create': z.tuple([Id, z.object({ catalogueId: Id, kind: CatalogueKind })]),
  'playlists.list': z.tuple([Id]),
  'playlists.create': z.tuple([
    Id,
    z.object({ name: z.string().min(1).max(100), description: z.string().max(500).optional() }),
  ]),
  'playlists.add': z.tuple([Id, Id, z.array(Id).max(500)]),
  'playlists.read': z.tuple([Id, Id]),
  'playlists.drop': z.tuple([Id, Id, Id]),
  'music.findTrack': z.tuple([
    z.object({
      title: z.string().min(1).max(300),
      artist: z.string().min(1).max(300),
      album: z.string().max(300).optional(),
      isrc: z.string().max(20).optional(),
    }),
  ]),
  'notifications.send': z.tuple([
    Id,
    z.object({ title: z.string().min(1).max(100), body: z.string().min(1).max(500) }),
  ]),
} as const;

type Method = keyof typeof ARGS;

const EMIT_WINDOW_MILLISECONDS = 60_000;

const MOST_EMITS_PER_WINDOW = 30;

/**
 * Whether a method name is one the broker answers.
 *
 * @param method - What the plugin asked for.
 * @returns Whether it is known.
 */
const isMethod = (method: string): method is Method => Object.hasOwn(ARGS, method);

/**
 * The broker: the one place a plugin's questions of Valence are answered. Each question is read
 * with its own schema, checked against the permissions the plugin was installed with, and — where
 * it names a person — checked against who the plugin is running for. A page or panel acts only for
 * the viewer looking at it; scheduled and event-driven work acts only for people who have used or
 * connected the plugin; a question asked once its invocation has finished acts for nobody.
 *
 * Refusals are thrown as sentences the plugin sees as ordinary errors.
 *
 * @param options - The plugin, where it keeps things, what it may reach, and how it logs.
 * @returns The broker, answering one question at a time as JSON.
 */
const createPluginBroker = ({
  installation,
  store,
  host,
  fetch,
  tokensFor,
  log,
}: CreatePluginBrokerOptions): PluginBroker => {
  const granted = installation.manifest.permissions;
  const name = installation.manifest.name;
  const emitted: number[] = [];

  const find = <K extends Permission['kind']>(kind: K): Extract<Permission, { kind: K }> | null =>
    granted.find(
      (permission): permission is Extract<Permission, { kind: K }> => permission.kind === kind,
    ) ?? null;

  const needs = (kind: Permission['kind'], access?: string): void => {
    const permission = find(kind);

    if (permission === null) {
      throw new Error(`${name} was not given the ${kind} permission.`);
    }

    if (access !== undefined && 'access' in permission && permission.access !== access) {
      throw new Error(`${name} was given ${kind} ${permission.access}, not ${access}.`);
    }
  };

  const actsFor = async (profileId: string, scope: BrokerScope | null): Promise<void> => {
    if (scope === null) {
      throw new Error('That was asked after the work it belonged to had finished.');
    }

    if (scope.kind === 'viewer') {
      if (scope.profileId !== profileId) {
        throw new Error(`${name} may only act for the person using it.`);
      }

      return;
    }

    if (!(await store.profilesOf(installation.id)).includes(profileId)) {
      throw new Error(`${name} may only act for people who have used it.`);
    }
  };

  const hasProvider = (provider: string): void => {
    const accounts = find('accounts');

    if (accounts === null || !accounts.providers.some((each) => each.id === provider)) {
      throw new Error(`${name} has no account provider called ${provider}.`);
    }
  };

  const answer = async (method: Method, args: readonly JsonValue[], scope: BrokerScope | null) => {
    switch (method) {
      case 'settings.read':
        return installation.settings;
      case 'log.info':
      case 'log.warn':
      case 'log.error': {
        const [message] = ARGS[method].parse(args);

        log(method === 'log.info' ? 'info' : method === 'log.warn' ? 'warn' : 'error', message);

        return null;
      }
      case 'events.emit': {
        needs('emits');

        const [id, detail] = ARGS[method].parse(args);
        const declared = installation.manifest.contributes.emits.find((emit) => emit.id === id);

        if (declared === undefined) {
          throw new Error(`This plugin did not declare an event called ${id}.`);
        }

        const since = Date.now() - EMIT_WINDOW_MILLISECONDS;

        emitted.splice(0, emitted.length, ...emitted.filter((at) => at > since));

        if (emitted.length >= MOST_EMITS_PER_WINDOW) {
          throw new Error('This plugin has sent too many events this minute.');
        }

        emitted.push(Date.now());

        await host.events.emit({
          pluginId: installation.id,
          pluginName: name,
          name: id,
          title: declared.title,
          detail: Object.fromEntries(Object.entries(detail ?? {}).slice(0, 20)),
        });

        return null;
      }
      case 'crypto.hmac': {
        const [algorithm, key, message, encoding] = ARGS[method].parse(args);

        return createHmac(algorithm, key)
          .update(message)
          .digest(encoding ?? 'hex');
      }
      case 'crypto.equal': {
        const [left, right] = ARGS[method].parse(args).map((text) => Buffer.from(text));

        return left !== undefined && right !== undefined && left.length === right.length
          ? timingSafeEqual(left, right)
          : false;
      }
      case 'storage.get': {
        needs('storage');

        const [key] = ARGS[method].parse(args);

        return store.readValue(installation.id, key);
      }
      case 'storage.set': {
        const quota = find('storage');

        if (quota === null) {
          throw new Error(`${name} was not given the storage permission.`);
        }

        const [key, value] = ARGS[method].parse(args);
        const bytes = Buffer.byteLength(JSON.stringify(value)) + Buffer.byteLength(key);
        const already = await store.bytesKept(installation.id, key);

        if (already + bytes > quota.quotaBytes) {
          throw new Error(
            `${name} has used all of the ${quota.quotaBytes.toString()} bytes it may keep.`,
          );
        }

        await store.writeValue(installation.id, key, value, bytes);

        return null;
      }
      case 'storage.delete': {
        needs('storage');

        const [key] = ARGS[method].parse(args);

        await store.forgetValue(installation.id, key);

        return null;
      }
      case 'storage.keys': {
        needs('storage');

        const [prefix] = ARGS[method].parse(args);

        return store.listKeys(installation.id, prefix ?? '');
      }
      case 'http.fetch': {
        needs('network');

        const [url, init] = ARGS[method].parse(args);

        return fetch(url, init ?? {});
      }
      case 'accounts.connection': {
        needs('accounts');

        const [profileId, provider] = ARGS[method].parse(args);

        hasProvider(provider);
        await actsFor(profileId, scope);

        return tokensFor(profileId, provider);
      }
      case 'accounts.disconnect': {
        needs('accounts');

        const [profileId, provider] = ARGS[method].parse(args);

        hasProvider(provider);
        await actsFor(profileId, scope);
        await store.forgetConnection(installation.id, profileId, provider);

        return null;
      }
      case 'profiles.list': {
        const ids = await store.profilesOf(installation.id);
        const found = await Promise.all(ids.map((id) => host.profiles.read(id)));

        return found.flatMap((profile) =>
          profile === null ? [] : [{ id: profile.id, name: profile.name }],
        );
      }
      case 'library.get': {
        needs('library');

        const [mediaId] = ARGS[method].parse(args);

        return host.library.get(mediaId);
      }
      case 'library.search': {
        needs('library');

        const [query, kinds] = ARGS[method].parse(args);

        return host.library.search(query, kinds ?? []);
      }
      case 'library.findByExternalId': {
        needs('library');

        const [source, id] = ARGS[method].parse(args);

        return host.library.findByExternalId(source, id);
      }
      case 'library.episodes': {
        needs('library');

        const [seriesId] = ARGS[method].parse(args);

        return host.library.episodes(seriesId);
      }
      case 'viewing.progress': {
        needs('viewing');

        const [profileId, since] = ARGS[method].parse(args);

        await actsFor(profileId, scope);

        return host.viewing.progress(profileId, since ?? null);
      }
      case 'viewing.markWatched': {
        needs('viewing', 'write');

        const [profileId, mediaId, watchedAt] = ARGS[method].parse(args);

        await actsFor(profileId, scope);
        await host.viewing.markWatched(profileId, mediaId, watchedAt ?? null);

        return null;
      }
      case 'viewing.markUnwatched': {
        needs('viewing', 'write');

        const [profileId, mediaId] = ARGS[method].parse(args);

        await actsFor(profileId, scope);
        await host.viewing.markUnwatched(profileId, mediaId);

        return null;
      }
      case 'requests.searchCatalogue': {
        needs('requests');

        const [query, kind] = ARGS[method].parse(args);

        return host.requests.searchCatalogue(query, kind);
      }
      case 'requests.create': {
        needs('requests');

        const [profileId, hit] = ARGS[method].parse(args);

        await actsFor(profileId, scope);

        return host.requests.create(profileId, hit);
      }
      case 'playlists.list': {
        needs('playlists');

        const [profileId] = ARGS[method].parse(args);

        await actsFor(profileId, scope);

        return host.playlists.list(profileId);
      }
      case 'playlists.create': {
        needs('playlists', 'write');

        const [profileId, playlist] = ARGS[method].parse(args);

        await actsFor(profileId, scope);

        return host.playlists.create(profileId, {
          name: playlist.name,
          description: playlist.description ?? null,
        });
      }
      case 'playlists.add': {
        needs('playlists', 'write');

        const [profileId, playlistId, mediaIds] = ARGS[method].parse(args);

        await actsFor(profileId, scope);
        await host.playlists.add(profileId, playlistId, mediaIds);

        return null;
      }
      case 'playlists.read': {
        needs('playlists');

        const [profileId, playlistId] = ARGS[method].parse(args);

        await actsFor(profileId, scope);

        return host.playlists.read(profileId, playlistId);
      }
      case 'playlists.drop': {
        needs('playlists', 'write');

        const [profileId, playlistId, entryId] = ARGS[method].parse(args);

        await actsFor(profileId, scope);
        await host.playlists.drop(profileId, playlistId, entryId);

        return null;
      }
      case 'music.findTrack': {
        needs('library');

        const [track] = ARGS[method].parse(args);

        return host.music.findTrack({
          title: track.title,
          artist: track.artist,
          album: track.album ?? null,
          isrc: track.isrc ?? null,
        });
      }
      case 'notifications.send': {
        needs('notifications');

        const [profileId, note] = ARGS[method].parse(args);

        await actsFor(profileId, scope);
        await host.notifications.send(profileId, { ...note, from: name });

        return null;
      }
    }
  };

  return async (method, text, scope) => {
    if (!isMethod(method)) {
      throw new Error(`Valence has no ${method} for plugins.`);
    }

    let args: z.infer<typeof ArgsSchema>;

    try {
      args = ArgsSchema.parse(JSON.parse(text));
    } catch {
      throw new Error(`${method} was asked with something Valence could not read.`);
    }

    let answered: Awaited<ReturnType<typeof answer>>;

    try {
      answered = await answer(method, args, scope);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error(`${method} was asked with something Valence could not read.`);
      }

      throw error;
    }

    return JSON.stringify(answered);
  };
};

const ArgsSchema = z.array(JsonValueSchema).max(8);

export type { AccountTokens, CreatePluginBrokerOptions, PluginBroker };

export { createPluginBroker };
