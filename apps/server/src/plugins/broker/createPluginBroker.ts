import { createHash, createHmac, randomBytes, timingSafeEqual, webcrypto } from 'node:crypto';
import { PluginRefusalError } from '@ValenceServer/plugins/broker/PluginRefusalError';
import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { Permission } from '@ValenceSDK/manifest/PermissionSchema';
import type { PluginFetch } from '@ValenceServer/plugins/network/createPluginFetch';
import type { InstalledRecord, PluginStore } from '@ValenceServer/plugins/store/PluginStore';
import type { BrokerScope } from './BrokerScope';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import type { PluginHost } from './PluginHost';
import { asPersonLooking } from './asPersonLooking';
import { multipartOf } from './multipartOf';
import { verifiesSignature } from './verifiesSignature';
import { LocalIdSchema } from '@ValenceSDK/manifest/LocalIdSchema';
import { JOB_LIMITS } from '@ValenceSDK/jobs/JOB_LIMITS';

type AccountTokens = { accessToken: string; expiresAt: string | null; account: string | null };

type CreatePluginBrokerOptions = {
  installation: Pick<InstalledRecord, 'id' | 'manifest' | 'settings'>;
  store: PluginStore;
  host: PluginHost;
  fetch: PluginFetch;
  tokensFor: (profileId: string, provider: string) => Promise<AccountTokens | null>;
  seal: (secret: string) => string;
  open: (sealed: string) => string | null;
  log: (level: 'info' | 'warn' | 'error', message: string) => void;
  emitted?: number[];
};

type PluginBroker = (method: string, args: string, scope: BrokerScope | null) => Promise<string>;

const Id = z.string().min(1).max(200);

const SECRET_MOST_CHARACTERS = 4096;

const MOST_SECRETS_PER_PROFILE = 32;

const Key = z.string().min(1).max(200);

const MediaKind = z.enum(['film', 'series', 'episode', 'artist', 'album', 'track', 'book']);

const MOST_LISTED = 200;

const MOST_AT_ONCE = 200;

const MOST_PROGRESS = 1_000_000_000;

const MOST_HASHED = 8_000_000;

const MOST_RANDOM_BYTES = 1024;

const MOST_MD5_BYTES = 1_000_000;

const SUBTLE_NAMES = { sha1: 'SHA-1', sha256: 'SHA-256', sha512: 'SHA-512' } as const;

const CatalogueKind = z.enum(['film', 'series', 'album', 'track']);

const ExternalSource = z.enum(['tmdb', 'tvdb', 'imdb', 'anilist', 'mal', 'musicbrainz', 'isrc']);

const Moment = z.iso.datetime({ offset: true });

const Reading = z.object({ profileId: Id }).strict().nullish();

const Detail = z.record(
  z.string().max(60),
  z.union([z.string().max(500), z.number(), z.boolean(), z.null()]),
);

const FetchInit = z
  .object({
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
    headers: z.record(z.string().max(100), z.string().max(8000)).optional(),
    body: z.string().max(1_000_000).optional(),
    form: z
      .record(
        z.string().min(1).max(100),
        z.union([
          z.string().max(100_000),
          z.object({
            base64: z.base64().max(14_000_000),
            fileName: z.string().min(1).max(200),
            contentType: z.string().min(1).max(100),
          }),
        ]),
      )
      .optional(),
  })
  .refine((init) => init.body === undefined || init.form === undefined)
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
  'secrets.get': z.tuple([Id, Key]),
  'secrets.set': z.tuple([Id, Key, z.string().min(1).max(SECRET_MOST_CHARACTERS)]),
  'secrets.delete': z.tuple([Id, Key]),
  'secrets.keys': z.tuple([Id]),
  'events.emit': z.tuple([z.string().regex(/^[a-z][a-z0-9-]{0,39}$/), Detail.optional()]),
  'jobs.enqueue': z.tuple([
    LocalIdSchema,
    JsonValueSchema.optional(),
    z
      .object({
        afterSeconds: z.number().int().min(0).max(JOB_LIMITS.afterSeconds).optional(),
        key: z.string().min(1).max(JOB_LIMITS.keyCharacters).optional(),
        profileId: Id.optional(),
      })
      .strict()
      .optional(),
  ]),
  'jobs.progress': z.tuple([
    z.number().int().min(0).max(MOST_PROGRESS),
    z.number().int().min(0).max(MOST_PROGRESS),
  ]),
  'crypto.hmac': z.tuple([
    z.enum(['sha1', 'sha256', 'sha512']),
    z.string().max(4096),
    z.string().max(1_000_000),
    z.enum(['hex', 'base64']).optional(),
  ]),
  'crypto.equal': z.tuple([z.string().max(4096), z.string().max(4096)]),
  'crypto.digest': z.tuple([
    z.enum(['md5', 'sha1', 'sha256', 'sha512']),
    z.string().max(MOST_HASHED),
    z.enum(['hex', 'base64']).optional(),
    z.enum(['utf8', 'base64']).optional(),
  ]),
  'crypto.random': z.tuple([
    z.number().int().min(1).max(MOST_RANDOM_BYTES),
    z.enum(['hex', 'base64']).optional(),
  ]),
  'crypto.verify': z.tuple([
    z.enum(['ed25519', 'rsa-sha256', 'ecdsa-sha256']),
    z.string().min(1).max(8192),
    z.string().max(MOST_HASHED),
    z.string().min(1).max(8192),
    z.enum(['hex', 'base64']).optional(),
  ]),
  'http.fetch': z.tuple([z.string().max(2000), FetchInit]),
  'http.fetchBytes': z.tuple([z.string().max(2000), FetchInit]),
  'accounts.connection': z.tuple([Id, Id]),
  'accounts.disconnect': z.tuple([Id, Id]),
  'profiles.list': z.tuple([]),
  'library.get': z.tuple([Id, Reading.optional()]),
  'library.search': z.tuple([
    z.string().min(1).max(200),
    z.array(MediaKind).max(MediaKind.options.length).nullish(),
    Reading.optional(),
  ]),
  'library.findByExternalId': z.tuple([
    ExternalSource,
    z.string().min(1).max(100),
    Reading.optional(),
  ]),
  'library.episodes': z.tuple([Id, Reading.optional()]),
  'library.list': z.tuple([
    z
      .object({
        kind: MediaKind,
        after: z.string().min(1).max(8000).optional(),
        limit: z.number().int().min(1).max(MOST_LISTED).optional(),
      })
      .strict(),
    Reading.optional(),
  ]),
  'library.children': z.tuple([Id, Reading.optional()]),
  'library.details': z.tuple([z.array(Id).max(MOST_AT_ONCE), Reading.optional()]),
  'viewing.progress': z.tuple([Id, Moment.optional()]),
  'viewing.markWatched': z.tuple([Id, Id, Moment.optional()]),
  'viewing.markUnwatched': z.tuple([Id, Id]),
  'viewing.state': z.tuple([Id, z.array(Id).max(MOST_AT_ONCE)]),
  'requests.searchCatalogue': z.tuple([z.string().min(1).max(200), CatalogueKind]),
  'requests.create': z.tuple([Id, z.object({ catalogueId: Id, kind: CatalogueKind })]),
  'requests.missingAlbums': z.tuple([Id, Id]),
  'playlists.list': z.tuple([Id]),
  'playlists.create': z.tuple([
    Id,
    z.object({ name: z.string().min(1).max(100), description: z.string().max(500).optional() }),
  ]),
  'playlists.add': z.tuple([
    Id,
    Id,
    z
      .array(
        z.union([
          Id,
          z.object({
            title: z.string().trim().min(1).max(300),
            artist: z.string().trim().min(1).max(300),
            album: z.string().trim().min(1).max(300).nullish(),
            releaseId: z.string().uuid().nullish(),
          }),
        ]),
      )
      .max(500),
  ]),
  'playlists.read': z.tuple([Id, Id]),
  'playlists.drop': z.tuple([Id, Id, Id]),
  'music.findTrack': z.tuple([
    z.object({
      title: z.string().min(1).max(300),
      artist: z.string().min(1).max(300),
      album: z.string().max(300).optional(),
      isrc: z.string().max(20).optional(),
    }),
    Reading.optional(),
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
 * Passes on why a request to another website failed, which says nothing of Valence itself, as
 * words the plugin may read.
 *
 * @param error - What the request failed with.
 * @returns Nothing; it always throws.
 */
const asRefusal = (error: Error | string): never => {
  if (error instanceof PluginRefusalError) {
    throw error;
  }

  const message = typeof error === 'string' ? error : error.message;

  throw new PluginRefusalError(message, { cause: error });
};

/**
 * The broker: the one place a plugin's questions of Valence are answered. Each question is read
 * with its own schema, checked against the permissions the plugin was installed with, and — where
 * it names a person — checked against who the plugin is running for. A page or panel acts only for
 * the viewer looking at it; scheduled, queued and event-driven work acts only for people who have
 * used or connected the plugin, except that a plugin hearing everybody's viewing may read and change
 * the viewing of the person an event it is handling is about; a question asked once its invocation
 * has finished acts for nobody.
 *
 * Refusals are thrown as sentences the plugin sees as ordinary errors.
 *
 * @param options - The plugin, where it keeps things, what it may reach, how it logs, and when it
 * last emitted events, which outlives one sandbox so a restart does not reset the limit.
 * @returns The broker, answering one question at a time as JSON.
 */
const createPluginBroker = ({
  installation,
  store,
  host,
  fetch,
  tokensFor,
  seal,
  open,
  log,
  emitted = [],
}: CreatePluginBrokerOptions): PluginBroker => {
  const granted = installation.manifest.permissions;
  const name = installation.manifest.name;
  let secretWrites: Promise<void> = Promise.resolve();
  let jobWrites: Promise<void> = Promise.resolve();

  const find = <K extends Permission['kind']>(kind: K): Extract<Permission, { kind: K }> | null =>
    granted.find(
      (permission): permission is Extract<Permission, { kind: K }> => permission.kind === kind,
    ) ?? null;

  const needs = (kind: Permission['kind'], access?: string): void => {
    const permission = find(kind);

    if (permission === null) {
      throw new PluginRefusalError(`${name} was not given the ${kind} permission.`);
    }

    if (access !== undefined && 'access' in permission && permission.access !== access) {
      throw new PluginRefusalError(
        `${name} was given ${kind} ${permission.access}, not ${access}.`,
      );
    }
  };

  const stillRunning = (scope: BrokerScope | null): BrokerScope => {
    if (scope === null) {
      throw new PluginRefusalError('That was asked after the work it belonged to had finished.');
    }

    return scope;
  };

  const actsFor = async (
    profileId: string,
    scope: BrokerScope | null,
    isAboutViewing = false,
  ): Promise<BrokerScope> => {
    const running = stillRunning(scope);

    if (running.kind === 'viewer') {
      if (running.profileId !== profileId) {
        throw new PluginRefusalError(`${name} may only act for the person using it.`);
      }

      return running;
    }

    if (running.kind === 'nobody') {
      throw new PluginRefusalError(
        `${name} may not act for anybody for a request nobody signed in to.`,
      );
    }

    const hearsEverybody = find('viewing')?.household === true;

    if (
      isAboutViewing &&
      hearsEverybody &&
      running.isHousehold === true &&
      running.profileId === profileId
    ) {
      if ((await host.profiles.read(profileId)) === null) {
        throw new PluginRefusalError(`${name} may not act for somebody who is no longer here.`);
      }

      return running;
    }

    if (!(await store.profilesOf(installation.id)).includes(profileId)) {
      throw new PluginRefusalError(`${name} may only act for people who have used it.`);
    }

    return running;
  };

  const asThePerson = async (profileId: string, scope: BrokerScope | null): Promise<Viewer> => {
    const checked = await actsFor(profileId, scope);

    if (checked.kind !== 'viewer') {
      return host.viewerOf(profileId);
    }

    return asPersonLooking({ accountId: checked.accountId, profileId }, checked.reads);
  };

  const readingAs = async (
    scope: BrokerScope | null,
    reading: { profileId: string } | null | undefined,
  ): Promise<Viewer> => {
    const running = stillRunning(scope);
    const named = reading?.profileId ?? null;

    if (running.kind === 'nobody') {
      throw new PluginRefusalError(
        `${name} may not read the library for a request nobody signed in to.`,
      );
    }

    if (running.kind === 'viewer') {
      if (named !== null) {
        await actsFor(named, running);
      }

      return running.reads;
    }

    const profileId = named ?? running.profileId;

    if (profileId !== null && running.isHomeRow === true && profileId === running.profileId) {
      return host.viewerOf(profileId);
    }

    if (profileId !== null) {
      await actsFor(profileId, running);

      return host.viewerOf(profileId);
    }

    if (find('library')?.access !== 'everything') {
      throw new PluginRefusalError(`${name} must say which person it is reading the library for.`);
    }

    return asTheServer;
  };

  const hasProvider = (provider: string): void => {
    const accounts = find('accounts');

    if (accounts === null || !accounts.providers.some((each) => each.id === provider)) {
      throw new PluginRefusalError(`${name} has no account provider called ${provider}.`);
    }
  };

  const answer = async (method: Method, args: readonly JsonValue[], scope: BrokerScope | null) => {
    switch (method) {
      case 'settings.read':
        return installation.settings;
      case 'log.info':
      case 'log.warn':
      case 'log.error': {
        const [message, ...details] = ARGS[method].parse(args);
        const about = details
          .flatMap((detail) => Object.entries(detail))
          .map(([name, value]) => `${name}=${String(value)}`)
          .join(' ');

        log(
          method === 'log.info' ? 'info' : method === 'log.warn' ? 'warn' : 'error',
          about === '' ? message : `${message} (${about})`,
        );

        return null;
      }
      case 'events.emit': {
        needs('emits');

        const [id, detail] = ARGS[method].parse(args);
        const declared = installation.manifest.contributes.emits.find((emit) => emit.id === id);

        if (declared === undefined) {
          throw new PluginRefusalError(`This plugin did not declare an event called ${id}.`);
        }

        const since = Date.now() - EMIT_WINDOW_MILLISECONDS;

        emitted.splice(0, emitted.length, ...emitted.filter((at) => at > since));

        if (emitted.length >= MOST_EMITS_PER_WINDOW) {
          throw new PluginRefusalError('This plugin has sent too many events this minute.');
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
      case 'jobs.enqueue': {
        const [kind, payload = null, options = {}] = ARGS[method].parse(args);
        const running = stillRunning(scope);

        if (running.kind === 'nobody') {
          throw new PluginRefusalError(
            `${name} may not queue work for a request nobody signed in to.`,
          );
        }

        if (!installation.manifest.contributes.jobs.some((job) => job.id === kind)) {
          throw new PluginRefusalError(`${name} did not declare a job called ${kind}.`);
        }

        if (JSON.stringify(payload).length > JOB_LIMITS.payloadCharacters) {
          throw new PluginRefusalError(
            `A job's payload may be at most ${JOB_LIMITS.payloadCharacters.toString()} characters.`,
          );
        }

        if (options.profileId !== undefined) {
          await actsFor(options.profileId, running);
        }

        const profileId = options.profileId ?? running.profileId;

        if (profileId !== null && !(await store.profilesOf(installation.id)).includes(profileId)) {
          throw new PluginRefusalError(`${name} may only queue work for people who have used it.`);
        }

        const queued = jobWrites.then(async () => {
          if ((await host.jobs.waiting(installation.id)) >= JOB_LIMITS.waiting) {
            throw new PluginRefusalError(
              `${name} already has ${JOB_LIMITS.waiting.toString()} jobs waiting.`,
            );
          }

          return host.jobs.enqueue(
            { pluginId: installation.id, kind, payload, profileId },
            options.afterSeconds ?? 0,
            options.key ?? null,
          );
        });

        jobWrites = queued.then(
          () => undefined,
          () => undefined,
        );

        const id = await queued;

        return id === null ? null : { id };
      }
      case 'jobs.progress': {
        const [processed, total] = ARGS[method].parse(args);
        const running = stillRunning(scope);

        if (running.kind !== 'background' || running.jobId === undefined) {
          throw new PluginRefusalError('Only a job can say how far it has got.');
        }

        host.jobs.progress(running.jobId, name, Math.min(processed, total), total);

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
      case 'crypto.digest': {
        const [algorithm, message, encoding, messageEncoding] = ARGS[method].parse(args);
        const bytes = Buffer.from(message, messageEncoding ?? 'utf8');

        if (algorithm === 'md5') {
          if (bytes.byteLength > MOST_MD5_BYTES) {
            throw new PluginRefusalError('An md5 digest takes at most 1 MB.');
          }

          return createHash('md5')
            .update(bytes)
            .digest(encoding ?? 'hex');
        }

        return Buffer.from(await webcrypto.subtle.digest(SUBTLE_NAMES[algorithm], bytes)).toString(
          encoding ?? 'hex',
        );
      }
      case 'crypto.random': {
        const [bytes, encoding] = ARGS[method].parse(args);

        return randomBytes(bytes).toString(encoding ?? 'hex');
      }
      case 'crypto.verify': {
        const [algorithm, publicKey, message, signature, encoding] = ARGS[method].parse(args);

        return await verifiesSignature(
          algorithm,
          publicKey,
          message,
          Buffer.from(signature, encoding ?? 'hex'),
        );
      }
      case 'storage.get': {
        needs('storage');

        const [key] = ARGS[method].parse(args);

        return store.readValue(installation.id, key);
      }
      case 'storage.set': {
        const quota = find('storage');

        if (quota === null) {
          throw new PluginRefusalError(`${name} was not given the storage permission.`);
        }

        const [key, value] = ARGS[method].parse(args);
        const bytes = Buffer.byteLength(JSON.stringify(value)) + Buffer.byteLength(key);
        const already = await store.bytesKept(installation.id, key);

        if (already + bytes > quota.quotaBytes) {
          throw new PluginRefusalError(
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
      case 'secrets.get': {
        needs('storage');

        const [profileId, key] = ARGS[method].parse(args);

        await actsFor(profileId, scope);

        const sealed = await store.readSecret(installation.id, profileId, key);

        return sealed === null ? null : open(sealed);
      }
      case 'secrets.set': {
        needs('storage');

        const [profileId, key, value] = ARGS[method].parse(args);

        await actsFor(profileId, scope);

        const written = secretWrites.then(async () => {
          const kept = await store.secretKeysOf(installation.id, profileId);

          if (!kept.includes(key) && kept.length >= MOST_SECRETS_PER_PROFILE) {
            throw new PluginRefusalError(
              `${name} already keeps ${MOST_SECRETS_PER_PROFILE.toString()} secrets for this person.`,
            );
          }

          await store.writeSecret(installation.id, profileId, key, seal(value));
        });

        secretWrites = written.catch(() => undefined);
        await written;

        return null;
      }
      case 'secrets.keys': {
        needs('storage');

        const [profileId] = ARGS[method].parse(args);

        await actsFor(profileId, scope);

        return store.secretKeysOf(installation.id, profileId);
      }
      case 'secrets.delete': {
        needs('storage');

        const [profileId, key] = ARGS[method].parse(args);

        await actsFor(profileId, scope);
        await store.forgetSecret(installation.id, profileId, key);

        return null;
      }
      case 'http.fetch':
      case 'http.fetchBytes': {
        needs('network');

        const [url, init] = ARGS[method].parse(args);
        const as: 'base64' | 'text' = method === 'http.fetchBytes' ? 'base64' : 'text';
        const { form, ...rest } = { ...init, as };
        const sent =
          form === undefined
            ? rest
            : (() => {
                const { body, contentType } = multipartOf(form);

                return { ...rest, headers: { ...rest.headers, 'content-type': contentType }, body };
              })();
        const answer = await fetch(url, sent).catch(asRefusal);

        return as === 'base64'
          ? { status: answer.status, headers: answer.headers, base64: answer.text }
          : answer;
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
        if (stillRunning(scope).kind === 'nobody') {
          throw new PluginRefusalError(
            `${name} may not list people for a request nobody signed in to.`,
          );
        }

        const ids = await store.profilesOf(installation.id);
        const found = await Promise.all(ids.map((id) => host.profiles.read(id)));

        return found.flatMap((profile) =>
          profile === null ? [] : [{ id: profile.id, name: profile.name }],
        );
      }
      case 'library.get': {
        needs('library');

        const [mediaId, reading] = ARGS[method].parse(args);

        return host.library.get(mediaId, await readingAs(scope, reading));
      }
      case 'library.search': {
        needs('library');

        const [query, kinds, reading] = ARGS[method].parse(args);

        return host.library.search(query, kinds ?? [], await readingAs(scope, reading));
      }
      case 'library.findByExternalId': {
        needs('library');

        const [source, id, reading] = ARGS[method].parse(args);

        return host.library.findByExternalId(source, id, await readingAs(scope, reading));
      }
      case 'library.episodes': {
        needs('library');

        const [seriesId, reading] = ARGS[method].parse(args);

        return host.library.episodes(seriesId, await readingAs(scope, reading));
      }
      case 'library.list': {
        needs('library');

        const [ask, reading] = ARGS[method].parse(args);

        return host.library.list(
          { kind: ask.kind, after: ask.after ?? null, limit: ask.limit ?? MOST_LISTED },
          await readingAs(scope, reading),
        );
      }
      case 'library.children': {
        needs('library');

        const [id, reading] = ARGS[method].parse(args);

        return host.library.children(id, await readingAs(scope, reading));
      }
      case 'library.details': {
        needs('library');

        const [ids, reading] = ARGS[method].parse(args);

        return host.library.details(ids, await readingAs(scope, reading));
      }
      case 'viewing.progress': {
        needs('viewing');

        const [profileId, since] = ARGS[method].parse(args);

        await actsFor(profileId, scope, true);

        return host.viewing.progress(profileId, since ?? null);
      }
      case 'viewing.markWatched': {
        needs('viewing', 'write');

        const [profileId, mediaId, watchedAt] = ARGS[method].parse(args);

        await actsFor(profileId, scope, true);
        await host.viewing.markWatched(profileId, mediaId, watchedAt ?? null);

        return null;
      }
      case 'viewing.markUnwatched': {
        needs('viewing', 'write');

        const [profileId, mediaId] = ARGS[method].parse(args);

        await actsFor(profileId, scope, true);
        await host.viewing.markUnwatched(profileId, mediaId);

        return null;
      }
      case 'viewing.state': {
        needs('viewing');

        const [profileId, mediaIds] = ARGS[method].parse(args);

        await actsFor(profileId, scope, true);

        return host.viewing.state(profileId, mediaIds);
      }
      case 'requests.searchCatalogue': {
        needs('requests');

        if (stillRunning(scope).kind === 'nobody') {
          throw new PluginRefusalError(
            `${name} may not search the catalogue for a request nobody signed in to.`,
          );
        }

        const [query, kind] = ARGS[method].parse(args);

        return host.requests.searchCatalogue(query, kind);
      }
      case 'requests.create': {
        needs('requests');

        const [profileId, hit] = ARGS[method].parse(args);

        await actsFor(profileId, scope);

        return host.requests.create(profileId, hit);
      }
      case 'requests.missingAlbums': {
        needs('requests');
        needs('playlists');

        const [profileId, playlistId] = ARGS[method].parse(args);

        await actsFor(profileId, scope);

        return host.requests.missingAlbums(profileId, playlistId);
      }
      case 'playlists.list': {
        needs('playlists');

        const [profileId] = ARGS[method].parse(args);

        return host.playlists.list(await asThePerson(profileId, scope));
      }
      case 'playlists.create': {
        needs('playlists', 'write');

        const [profileId, playlist] = ARGS[method].parse(args);

        return host.playlists.create(await asThePerson(profileId, scope), {
          name: playlist.name,
          description: playlist.description ?? null,
        });
      }
      case 'playlists.add': {
        needs('playlists', 'write');

        const [profileId, playlistId, items] = ARGS[method].parse(args);

        await host.playlists.add(
          await asThePerson(profileId, scope),
          playlistId,
          items.map((item) =>
            typeof item === 'string'
              ? item
              : {
                  title: item.title,
                  artist: item.artist,
                  album: item.album ?? null,
                  releaseId: item.releaseId ?? null,
                },
          ),
        );

        return null;
      }
      case 'playlists.read': {
        needs('playlists');

        const [profileId, playlistId] = ARGS[method].parse(args);

        return host.playlists.read(await asThePerson(profileId, scope), playlistId);
      }
      case 'playlists.drop': {
        needs('playlists', 'write');

        const [profileId, playlistId, entryId] = ARGS[method].parse(args);

        await host.playlists.drop(await asThePerson(profileId, scope), playlistId, entryId);

        return null;
      }
      case 'music.findTrack': {
        needs('library');

        const [track, reading] = ARGS[method].parse(args);

        return host.music.findTrack(
          {
            title: track.title,
            artist: track.artist,
            album: track.album ?? null,
            isrc: track.isrc ?? null,
          },
          await readingAs(scope, reading),
        );
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
      throw new PluginRefusalError(`Valence has no ${method} for plugins.`);
    }

    let args: z.infer<typeof ArgsSchema>;

    try {
      args = ArgsSchema.parse(JSON.parse(text));
    } catch {
      throw new PluginRefusalError(`${method} was asked with something Valence could not read.`);
    }

    let answered: Awaited<ReturnType<typeof answer>>;

    try {
      answered = await answer(method, args, scope);
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new PluginRefusalError(`${method} was asked with something Valence could not read.`);
      }

      throw error;
    }

    return JSON.stringify(answered);
  };
};

const ArgsSchema = z.array(JsonValueSchema).max(8);

export type { AccountTokens, CreatePluginBrokerOptions, PluginBroker };

export { createPluginBroker };
