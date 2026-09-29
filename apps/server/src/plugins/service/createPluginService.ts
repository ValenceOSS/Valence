import { randomBytes } from 'node:crypto';
import { readPluginPackage } from '@ValenceSDK/package/readPluginPackage';
import { sha256Of } from '@ValenceSDK/package/sha256Of';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import { createPluginBroker } from '@ValenceServer/plugins/broker/createPluginBroker';
import { createPluginFetch } from '@ValenceServer/plugins/network/createPluginFetch';
import { createConnectTickets } from '@ValenceServer/plugins/accounts/createConnectTickets';
import { createPluginOAuth } from '@ValenceServer/plugins/accounts/createPluginOAuth';
import { createPluginRuntime } from '@ValenceServer/plugins/runtime/createPluginRuntime';
import { cleanSurface } from '@ValenceServer/plugins/surfaces/cleanSurface';
import { serviceNotice } from '@ValenceServer/plugins/surfaces/serviceNotice';
import { satisfiesApiRange } from '@ValenceServer/plugins/install/satisfiesApiRange';
import { isSignedBy } from '@ValenceSDK/package/isSignedBy';
import { readSignatureFile } from '@ValenceSDK/package/readSignatureFile';
import { sealSecret } from '@ValenceServer/plugins/sealSecret';
import { openSecret } from '@ValenceServer/plugins/openSecret';
import { changeSettings } from './changeSettings';
import { describeManifest } from './describeManifest';
import { summaryOf } from './summaryOf';
import { eventsFrom } from './eventsFrom';
import { openSettings } from './openSettings';
import { permissionsHashOf } from './permissionsHashOf';
import { nodesHeldBy } from './nodesHeldBy';
import { mayHearEvent } from '@ValenceSDK/manifest/mayHearEvent';
import type {
  CatalogueListing,
  InstalledPlugin,
  PluginChange,
  InstallPreview,
  PluginActAnswer,
  PluginContributions,
  PluginTrust,
} from '@ValenceContracts/schemas/Plugin';
import type { Surface } from '@ValenceSDK/surface/SurfaceSchema';
import type { SurfaceActRequest } from '@ValenceSDK/surface/SurfaceActRequestSchema';
import type { PluginPackage } from '@ValenceSDK/package/PluginPackageSchema';
import type { WebhookOccurrence } from '@ValenceServer/events/EventBus';
import type { CatalogueClient } from '@ValenceServer/plugins/catalogue/createCatalogueClient';
import type { PluginHost } from '@ValenceServer/plugins/broker/PluginHost';
import type { BrokerScope } from '@ValenceServer/plugins/broker/BrokerScope';
import type { InstalledRecord, PluginStore } from '@ValenceServer/plugins/store/PluginStore';
import type { CreatePluginRuntimeOptions } from '@ValenceServer/plugins/runtime/createPluginRuntime';
import type { PluginViewer } from './PluginViewer';

type FetchFor = (
  pluginId: string,
  hosts: readonly string[],
) => ReturnType<typeof createPluginFetch>;

type CreatePluginServiceOptions = {
  store: PluginStore;
  host: PluginHost;
  catalogue: CatalogueClient;
  keys: Readonly<Record<string, string>>;
  sealingKey: Buffer;
  redirectUri: string;
  apiVersion: string;
  enqueueSchedule: (pluginId: string, scheduleId: string, afterSeconds: number) => Promise<void>;
  log: (level: 'info' | 'warn' | 'error', message: string) => void;
  announce?: (change: PluginChange) => void;
  fetchFor?: FetchFor;
  startSandbox?: CreatePluginRuntimeOptions['start'];
  now?: () => number;
};

type Pending = {
  bytes: Uint8Array;
  plugin: PluginPackage;
  trust: PluginTrust;
  accountId: string;
  permissionsHash: string;
  expiresAt: number;
};

type Surroundings = {
  kind: 'page' | 'panel';
  id: string;
  subject: { kind: string; id: string } | null;
};

const PENDING_FOR_MILLISECONDS = 15 * 60 * 1000;

const CONNECT_ACTION = 'valence.accounts.connect';

const DISCONNECT_ACTION = 'valence.accounts.disconnect';

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']);

const ASSET_TYPES: Readonly<Record<string, string>> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  webp: 'image/webp',
};

/**
 * Everything the server does with plugins, in one place the routes and the job queue talk to:
 * what is installed and what the catalogue offers; previewing a package before it is installed,
 * with its permissions shown and a fingerprint of them that the install has to repeat; installing,
 * changing and removing; the pages, panels and themes plugins add; drawing a page or panel and
 * acting on it; the pictures a plugin shows; connecting outside accounts; scheduled work; and
 * telling plugins what happened.
 *
 * @param options - Where plugins are kept, what they may use, and how to reach the catalogue.
 * @returns The service.
 */
const createPluginService = ({
  store,
  host,
  catalogue,
  keys,
  sealingKey,
  redirectUri,
  apiVersion,
  enqueueSchedule,
  log,
  announce = () => undefined,
  fetchFor = (pluginId, hosts) => createPluginFetch({ pluginId, hosts }),
  startSandbox,
  now = Date.now,
}: CreatePluginServiceOptions) => {
  const pending = new Map<string, Pending>();
  const unpacked = new Map<string, PluginPackage>();

  const hostsOf = (record: Pick<InstalledRecord, 'manifest'>): string[] =>
    record.manifest.permissions.flatMap((permission) =>
      permission.kind === 'network' ? permission.hosts : [],
    );

  const unpack = (record: InstalledRecord): PluginPackage | null => {
    const known = unpacked.get(record.sha256);

    if (known !== undefined) {
      return known;
    }

    const read = readPluginPackage(Buffer.from(record.packageBase64, 'base64'));

    if (!read.ok) {
      return null;
    }

    unpacked.set(record.sha256, read.plugin);

    return read.plugin;
  };

  const tickets = createConnectTickets({ now });

  const oauth = createPluginOAuth({
    redirectUri,
    store,
    seal: (secret) => sealSecret(sealingKey, secret),
    open: (sealed) => openSecret(sealingKey, sealed),
    exchange: async (pluginId, tokenUrl, form) => {
      const record = await store.read(pluginId);

      if (record === null) {
        return { status: 404, text: '' };
      }

      const answered = await fetchFor(pluginId, hostsOf(record)).fetch(tokenUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/x-www-form-urlencoded',
          accept: 'application/json',
        },
        body: new URLSearchParams(form).toString(),
      });

      return { status: answered.status, text: answered.text };
    },
    now,
  });

  const credentialsFor = (record: InstalledRecord, providerId: string) => {
    const accounts = record.manifest.permissions.find(
      (permission) => permission.kind === 'accounts',
    );
    const provider =
      accounts?.kind === 'accounts'
        ? accounts.providers.find((each) => each.id === providerId)
        : undefined;

    if (provider === undefined) {
      return null;
    }

    const settings = openSettings(record.manifest, record.settings, sealingKey);
    const clientId = settings[provider.clientIdSetting];
    const clientSecret =
      provider.clientSecretSetting === undefined
        ? undefined
        : settings[provider.clientSecretSetting];

    return {
      provider,
      credentials:
        typeof clientId === 'string' && clientId !== ''
          ? { clientId, clientSecret: typeof clientSecret === 'string' ? clientSecret : null }
          : null,
    };
  };

  const runtime = createPluginRuntime({
    brokerFor: (record) =>
      createPluginBroker({
        installation: {
          id: record.id,
          manifest: record.manifest,
          settings: openSettings(record.manifest, record.settings, sealingKey),
        },
        store,
        host,
        fetch: fetchFor(record.id, hostsOf(record)).fetch,
        tokensFor: async (profileId, providerId) => {
          const found = credentialsFor(record, providerId);

          return found === null || found.credentials === null
            ? null
            : oauth.tokensFor(record.id, profileId, found.provider, found.credentials);
        },
        log: (level, message) => {
          log(level, `plugin ${record.id}: ${message}`);
        },
      }),
    onProblem: (pluginId, problem) => {
      log('warn', `plugin ${pluginId}: ${problem}`);
      void store.change(pluginId, { problem });
    },
    onLog: (pluginId, level, message) => {
      log(level, `plugin ${pluginId}: ${message}`);
    },
    ...(startSandbox === undefined ? {} : { start: startSandbox }),
  });

  const runnable = async (pluginId: string) => {
    const record = await store.read(pluginId);

    if (record === null || !record.isEnabled) {
      return null;
    }

    const plugin = unpack(record);

    return plugin === null || plugin.code === undefined
      ? null
      : { record, plugin, code: plugin.code };
  };

  const bringDataUpToDate = async (
    pluginId: string,
    versions: { from: string; to: string },
  ): Promise<string | null> => {
    const record = await store.read(pluginId);
    const plugin = record === null ? null : unpack(record);

    if (record === null || plugin?.code === undefined) {
      return null;
    }

    try {
      await runtime.invoke(
        { record, code: plugin.code },
        'upgraded',
        { versions },
        {
          kind: 'background',
        },
      );

      return null;
    } catch (error) {
      return error instanceof Error && error.message !== '' ? error.message : 'It failed.';
    }
  };

  const latestVersions = async (): Promise<Map<string, string>> => {
    const read = await catalogue.read();

    return new Map((read.catalogue?.plugins ?? []).map((entry) => [entry.id, entry.version]));
  };

  const scheduleAll = async (record: InstalledRecord): Promise<void> => {
    if (!record.isEnabled || record.manifest.entry === undefined) {
      return;
    }

    for (const schedule of record.manifest.contributes.schedules) {
      await enqueueSchedule(record.id, schedule.id, schedule.everyMinutes * 60);
    }
  };

  const prepare = async (
    bytes: Uint8Array,
    plugin: PluginPackage,
    trust: PluginTrust,
    accountId: string,
    extraWarnings: string[],
  ): Promise<InstallPreview | { problem: string }> => {
    const { manifest } = plugin;

    if (!satisfiesApiRange(manifest.apiVersion, apiVersion)) {
      return {
        problem: `${manifest.name} was written for plugin API ${manifest.apiVersion}, and this server offers ${apiVersion}.`,
      };
    }

    const existing = await store.read(manifest.id);
    const widened =
      existing === null
        ? []
        : manifest.permissions.filter(
            (permission) =>
              !existing.manifest.permissions.some(
                (was) => JSON.stringify(was) === JSON.stringify(permission),
              ),
          );
    const warnings = [
      ...extraWarnings,
      ...(widened.length === 0
        ? []
        : [
            `This version asks for more than the one installed: ${widened.map((each) => each.kind).join(', ')}.`,
          ]),
    ];
    const token = randomBytes(24).toString('base64url');
    const permissionsHash = permissionsHashOf(manifest.permissions);

    for (const [key, entry] of pending) {
      if (entry.expiresAt < now()) {
        pending.delete(key);
      }
    }

    pending.set(token, {
      bytes,
      plugin,
      trust,
      accountId,
      permissionsHash,
      expiresAt: now() + PENDING_FOR_MILLISECONDS,
    });

    return {
      token,
      permissionsHash,
      plugin: { ...describeManifest(manifest), trust },
      trust,
      warnings,
      replacesVersion: existing?.version ?? null,
    };
  };

  const draw = async (
    pluginId: string,
    at: Surroundings,
    viewer: PluginViewer,
    act: SurfaceActRequest | null,
  ): Promise<{ surface: Surface; navigate: string | null } | null> => {
    const found = await runnable(pluginId);

    if (found === null) {
      return null;
    }

    const { record, plugin, code } = found;
    const contributed =
      at.kind === 'page'
        ? record.manifest.contributes.pages.find((page) => page.id === at.id)
        : record.manifest.contributes.panels.find((panel) => panel.id === at.id);

    const held = nodesHeldBy(record.manifest, viewer.grants);

    if (
      contributed === undefined ||
      ('placement' in contributed && contributed.placement === 'admin' && !viewer.isAdmin) ||
      (contributed.requires !== undefined && !held.includes(contributed.requires))
    ) {
      return null;
    }

    await store.rememberProfile(record.id, viewer.profileId);

    const scope: BrokerScope = {
      kind: 'viewer',
      profileId: viewer.profileId,
      accountId: viewer.accountId,
      isAdmin: viewer.isAdmin,
    };
    const args = {
      id: at.id,
      viewer: { profileId: viewer.profileId, isAdmin: viewer.isAdmin, nodes: held },
      subject: at.subject,
    };
    const assets = new Set(Object.keys(plugin.assets));

    const render = async (): Promise<Surface> => {
      try {
        const answer = await runtime.invoke(
          { record, code },
          at.kind === 'page' ? 'page.render' : 'panel.render',
          args,
          scope,
        );
        const cleaned = cleanSurface(answer, record.manifest, assets);

        if (cleaned.problem !== null) {
          log(
            'warn',
            `plugin ${record.id}: sent a ${at.kind} Valence would not draw: ${cleaned.problem}`,
          );
        }

        return cleaned.surface;
      } catch (error) {
        log(
          'warn',
          `plugin ${record.id}: ${error instanceof Error ? error.message : 'failed to draw'}`,
        );

        return serviceNotice(`${record.manifest.name} is not answering`, 'Try again in a moment.');
      }
    };

    if (act === null) {
      return { surface: await render(), navigate: null };
    }

    const provider = act.action.payload?.['provider'];

    if (act.action.id === CONNECT_ACTION && typeof provider === 'string') {
      const ticket = tickets.issue({
        accountId: viewer.accountId,
        profileId: viewer.profileId,
        pluginId: record.id,
        provider,
        returnTo:
          'placement' in contributed && contributed.placement === 'account'
            ? `/?account=${encodeURIComponent(`plugin.${record.id}.${at.id}`)}`
            : '/',
      });

      return {
        surface: await render(),
        navigate: `/api/plugins/${encodeURIComponent(record.id)}/accounts/${encodeURIComponent(provider)}/connect?ticket=${ticket}`,
      };
    }

    if (act.action.id === DISCONNECT_ACTION && typeof provider === 'string') {
      await store.forgetConnection(record.id, viewer.profileId, provider);

      return { surface: await render(), navigate: null };
    }

    try {
      const answer = await runtime.invoke(
        { record, code },
        at.kind === 'page' ? 'page.act' : 'panel.act',
        { ...args, request: act },
        scope,
      );

      if (answer === 'null') {
        return { surface: await render(), navigate: null };
      }

      const cleaned = cleanSurface(answer, record.manifest, assets);

      if (cleaned.problem !== null) {
        log(
          'warn',
          `plugin ${record.id}: answered an action with something Valence would not draw: ${cleaned.problem}`,
        );
      }

      return { surface: cleaned.surface, navigate: null };
    } catch (error) {
      log(
        'warn',
        `plugin ${record.id}: ${error instanceof Error ? error.message : 'failed to act'}`,
      );

      return {
        surface: serviceNotice(
          `${record.manifest.name} could not do that`,
          'Try again in a moment.',
        ),
        navigate: null,
      };
    }
  };

  return {
    redirectUri,
    listInstalled: async (): Promise<InstalledPlugin[]> => {
      const latest = await latestVersions();

      return (await store.list()).map((record) => {
        const newer = latest.get(record.id);

        return summaryOf(
          record,
          runtime.stateOf(record.id),
          newer !== undefined && newer !== record.version ? newer : null,
        );
      });
    },
    readCatalogue: async (): Promise<CatalogueListing> => {
      const read = await catalogue.read();
      const installed = new Map((await store.list()).map((record) => [record.id, record.version]));

      return {
        isReachable: read.catalogue !== null,
        problem: read.problem,
        plugins: (read.catalogue?.plugins ?? []).map((entry) => ({
          id: entry.id,
          name: entry.name,
          description: entry.description,
          author: entry.author,
          version: entry.version,
          kinds: entry.kinds,
          permissions: entry.permissions,
          iconUrl: entry.iconUrl ?? null,
          sourceUrl: entry.sourceUrl,
          installedVersion: installed.get(entry.id) ?? null,
          isCompatible: satisfiesApiRange(entry.apiVersion, apiVersion),
        })),
      };
    },
    previewFromCatalogue: async (
      id: string,
      accountId: string,
    ): Promise<InstallPreview | { problem: string }> => {
      const read = await catalogue.read();
      const entry = read.catalogue?.plugins.find((each) => each.id === id);

      if (entry === undefined) {
        return { problem: read.problem ?? 'The catalogue has no plugin by that name.' };
      }

      const fetched = await catalogue.fetchPackage(entry);

      if ('problem' in fetched) {
        return fetched;
      }

      const opened = readPluginPackage(fetched.bytes);

      if (!opened.ok) {
        return { problem: opened.problem };
      }

      if (
        opened.plugin.manifest.id !== entry.id ||
        opened.plugin.manifest.version !== entry.version
      ) {
        return { problem: `${entry.name} is not the plugin the catalogue describes.` };
      }

      return prepare(fetched.bytes, opened.plugin, 'official', accountId, []);
    },
    previewUpload: async (
      bytes: Uint8Array,
      signature: string | null,
      accountId: string,
    ): Promise<InstallPreview | { problem: string }> => {
      const opened = readPluginPackage(bytes);

      if (!opened.ok) {
        return { problem: opened.problem };
      }

      const read = signature === null ? null : readSignatureFile(signature);
      const signedBy = read === null ? null : isSignedBy(bytes, read, keys);

      return prepare(
        bytes,
        opened.plugin,
        signedBy === null ? 'unsigned' : 'official',
        accountId,
        signature !== null && signedBy === null
          ? ['The signature that came with it is not from a key Valence recognises.']
          : [],
      );
    },
    install: async (
      asked: { token: string; permissionsHash: string; acceptUnsigned: boolean },
      accountId: string,
    ): Promise<InstalledPlugin | { refused: string }> => {
      const waiting = pending.get(asked.token);

      if (waiting === undefined || waiting.expiresAt < now() || waiting.accountId !== accountId) {
        return {
          refused: 'That preview has expired. Look at the plugin again before installing it.',
        };
      }

      if (waiting.permissionsHash !== asked.permissionsHash) {
        return { refused: 'The permissions accepted are not the ones this plugin asks for.' };
      }

      if (waiting.trust === 'unsigned' && !asked.acceptUnsigned) {
        return { refused: 'An unsigned plugin is only installed once its risk is accepted.' };
      }

      pending.delete(asked.token);

      const { manifest } = waiting.plugin;
      const existing = await store.read(manifest.id);
      const kept = changeSettings(manifest, existing?.settings ?? {}, {}, sealingKey);
      const upgradesFrom =
        existing !== null && existing.version !== manifest.version ? existing.version : null;

      if (upgradesFrom !== null) {
        await store.keepPrevious(manifest.id);
      }

      await store.save({
        id: manifest.id,
        version: manifest.version,
        trust: waiting.trust,
        manifest,
        packageBase64: Buffer.from(waiting.bytes).toString('base64'),
        sha256: sha256Of(waiting.bytes),
        isEnabled: existing?.isEnabled ?? true,
        settings: 'settings' in kept ? kept.settings : {},
        installedBy: accountId,
      });
      runtime.stop(manifest.id);

      const saved = await store.read(manifest.id);

      if (saved === null) {
        return { refused: 'The plugin could not be kept.' };
      }

      if (upgradesFrom !== null) {
        const problem = await bringDataUpToDate(manifest.id, {
          from: upgradesFrom,
          to: manifest.version,
        });

        if (problem !== null) {
          runtime.stop(manifest.id);
          await store.restorePrevious(manifest.id);
          log(
            'warn',
            `plugin ${manifest.id}: ${manifest.version} could not bring its data up to date, so ${upgradesFrom} was put back: ${problem}`,
          );
          announce({ pluginId: manifest.id, change: 'updated' });

          return {
            refused: `${manifest.name} ${manifest.version} could not bring its data up to date, so ${upgradesFrom} was put back as it was. ${problem}`,
          };
        }
      }

      log('info', `plugin ${manifest.id}: installed ${manifest.version} (${waiting.trust})`);
      await scheduleAll(saved);
      announce({ pluginId: manifest.id, change: existing === null ? 'installed' : 'updated' });

      return summaryOf(saved, runtime.stateOf(saved.id), null);
    },
    change: async (
      id: string,
      changes: {
        isEnabled?: boolean | undefined;
        settings?: Record<string, string | boolean | null> | undefined;
      },
    ): Promise<InstalledPlugin | { refused: string } | null> => {
      const record = await store.read(id);

      if (record === null) {
        return null;
      }

      const settings =
        changes.settings === undefined
          ? { settings: record.settings }
          : changeSettings(record.manifest, record.settings, changes.settings, sealingKey);

      if ('problem' in settings) {
        return { refused: settings.problem };
      }

      await store.change(id, {
        settings: settings.settings,
        problem: null,
        ...(changes.isEnabled === undefined ? {} : { isEnabled: changes.isEnabled }),
      });
      runtime.stop(id);

      const saved = await store.read(id);

      if (saved === null) {
        return null;
      }

      if (changes.isEnabled === true && !record.isEnabled) {
        await scheduleAll(saved);
      }

      announce({
        pluginId: id,
        change:
          changes.isEnabled === undefined || changes.isEnabled === record.isEnabled
            ? 'settings'
            : changes.isEnabled
              ? 'enabled'
              : 'disabled',
      });

      return summaryOf(saved, runtime.stateOf(id), null);
    },
    rollback: async (id: string): Promise<InstalledPlugin | { refused: string } | null> => {
      const record = await store.read(id);

      if (record === null) {
        return null;
      }

      if (record.previousVersion === null) {
        return { refused: 'No earlier version of this plugin is kept to go back to.' };
      }

      runtime.stop(id);

      if (!(await store.restorePrevious(id))) {
        return { refused: 'The earlier version could not be put back.' };
      }

      const saved = await store.read(id);

      if (saved === null) {
        return null;
      }

      await scheduleAll(saved);
      log('info', `plugin ${id}: rolled back from ${record.version} to ${saved.version}`);
      announce({ pluginId: id, change: 'updated' });

      return summaryOf(saved, runtime.stateOf(id), null);
    },
    uninstall: async (id: string): Promise<boolean> => {
      runtime.stop(id);

      const removed = await store.remove(id);

      if (removed) {
        log('info', `plugin ${id}: uninstalled`);
        announce({ pluginId: id, change: 'removed' });
      }

      return removed;
    },
    contributions: async (
      viewer: Pick<PluginViewer, 'isAdmin' | 'grants'>,
    ): Promise<PluginContributions> => {
      const enabled = (await store.list()).filter((record) => record.isEnabled);
      const mayUse = (record: InstalledRecord, requires: string | undefined): boolean =>
        requires === undefined || nodesHeldBy(record.manifest, viewer.grants).includes(requires);

      return {
        pages: enabled.flatMap((record) =>
          record.manifest.contributes.pages
            .filter((page) => page.placement === 'account' || viewer.isAdmin)
            .filter((page) => mayUse(record, page.requires))
            .map((page) => ({
              pluginId: record.id,
              pluginName: record.manifest.name,
              pageId: page.id,
              title: page.title,
              placement: page.placement,
              icon: page.icon ?? null,
            })),
        ),
        panels: enabled.flatMap((record) =>
          record.manifest.contributes.panels
            .filter((panel) => mayUse(record, panel.requires))
            .map((panel) => ({
              pluginId: record.id,
              pluginName: record.manifest.name,
              panelId: panel.id,
              title: panel.title,
              on: panel.on,
            })),
        ),
        themes: enabled.flatMap((record) =>
          record.manifest.contributes.themes.map((theme) => ({
            ...theme,
            pluginId: record.id,
            pluginName: record.manifest.name,
          })),
        ),
        nodes: enabled.flatMap((record) =>
          record.manifest.contributes.nodes.map((node) => ({
            node: `plugin.${record.id}.${node.id}` as const,
            pluginId: record.id,
            pluginName: record.manifest.name,
            title: node.title,
            description: node.description ?? null,
          })),
        ),
      };
    },
    render: (pluginId: string, at: Surroundings, viewer: PluginViewer) =>
      draw(pluginId, at, viewer, null),
    act: async (
      pluginId: string,
      at: Surroundings,
      viewer: PluginViewer,
      request: SurfaceActRequest,
    ): Promise<PluginActAnswer | null> => {
      const answered = await draw(pluginId, at, viewer, request);

      return answered === null
        ? null
        : { surface: SurfaceSchema.parse(answered.surface), navigate: answered.navigate };
    },
    asset: async (
      pluginId: string,
      name: string,
    ): Promise<{ body: Buffer; contentType: string } | null> => {
      const record = await store.read(pluginId);
      const plugin = record === null ? null : unpack(record);
      const encoded = plugin?.assets[name];
      const extension = name.split('.').pop() ?? '';
      const contentType = ASSET_TYPES[extension];

      return encoded === undefined || contentType === undefined
        ? null
        : { body: Buffer.from(encoded, 'base64'), contentType };
    },
    image: async (
      pluginId: string,
      url: string,
    ): Promise<{ body: Buffer; contentType: string } | null> => {
      const record = await store.read(pluginId);

      if (record === null || !record.isEnabled) {
        return null;
      }

      try {
        const answer = await fetchFor(record.id, hostsOf(record)).fetchBytes(url);
        const contentType = (answer.headers['content-type'] ?? '').split(';')[0]?.trim() ?? '';

        return answer.status === 200 && IMAGE_TYPES.has(contentType)
          ? { body: answer.body, contentType }
          : null;
      } catch {
        return null;
      }
    },
    connect: async (
      pluginId: string,
      providerId: string,
      asked: { ticket: string | null; viewer: PluginViewer | null; returnTo: string },
    ): Promise<{ location: string; browser: string } | { problem: string }> => {
      const ticket =
        asked.ticket === null ? null : tickets.redeem(asked.ticket, pluginId, providerId);

      if (asked.ticket !== null && ticket === null) {
        return { problem: 'That link has expired. Go back to Valence and try again.' };
      }

      const profileId = ticket?.profileId ?? asked.viewer?.profileId ?? null;

      if (profileId === null) {
        return { problem: 'Sign in to Valence first.' };
      }

      const record = await store.read(pluginId);

      if (record === null || !record.isEnabled) {
        return { problem: 'There is no such plugin.' };
      }

      const found = credentialsFor(record, providerId);

      if (found === null) {
        return { problem: `${record.manifest.name} has no account called ${providerId}.` };
      }

      if (found.credentials === null) {
        return {
          problem: `An administrator has not given ${record.manifest.name} its ${found.provider.name} client id yet.`,
        };
      }

      await store.rememberProfile(record.id, profileId);

      const browser = randomBytes(24).toString('base64url');
      const returnTo =
        ticket === null
          ? asked.returnTo
          : asked.viewer?.accountId === ticket.accountId
            ? ticket.returnTo
            : null;

      return {
        browser,
        location: oauth.begin({
          pluginId: record.id,
          provider: found.provider,
          credentials: found.credentials,
          profileId,
          browser,
          returnTo,
        }),
      };
    },
    finishConnection: async (answer: { state: string; code: string; browser: string }) => {
      const finished = await oauth.finish(answer);

      if (finished.ok) {
        void runnable(finished.pluginId).then((found) =>
          found === null
            ? undefined
            : runtime
                .invoke(
                  { record: found.record, code: found.code },
                  'accountConnected',
                  { connection: { profileId: finished.profileId, provider: finished.provider } },
                  { kind: 'background' },
                )
                .catch((error) => {
                  log(
                    'warn',
                    `plugin ${finished.pluginId}: ${error instanceof Error ? error.message : 'failed'}`,
                  );
                }),
        );
      }

      return finished;
    },
    disconnect: (pluginId: string, providerId: string, profileId: string): Promise<boolean> =>
      store.forgetConnection(pluginId, profileId, providerId),
    runSchedule: async (pluginId: string, scheduleId: string): Promise<void> => {
      const found = await runnable(pluginId);
      const schedule = found?.record.manifest.contributes.schedules.find(
        (each) => each.id === scheduleId,
      );

      if (found === null || schedule === undefined) {
        return;
      }

      try {
        await runtime.invoke(
          { record: found.record, code: found.code },
          'schedule',
          { id: scheduleId },
          { kind: 'background' },
        );
      } catch (error) {
        log(
          'warn',
          `plugin ${pluginId}: ${schedule.label} failed: ${error instanceof Error ? error.message : 'failed'}`,
        );
      } finally {
        await enqueueSchedule(pluginId, scheduleId, schedule.everyMinutes * 60);
      }
    },
    dispatch: (occurrence: WebhookOccurrence): void => {
      const events = eventsFrom(occurrence, new Date(now()).toISOString());

      if (events.length === 0) {
        return;
      }

      void store.list().then(async (records) => {
        for (const record of records) {
          if (!record.isEnabled) {
            continue;
          }

          for (const event of events) {
            const topic = record.manifest.contributes.events.find((each) => each === event.topic);

            if (topic === undefined || !mayHearEvent(record.manifest.permissions, topic)) {
              continue;
            }

            const found = await runnable(record.id);

            if (found === null) {
              continue;
            }

            await runtime
              .invoke(
                { record: found.record, code: found.code },
                'event',
                { event },
                { kind: 'background' },
              )
              .catch((error) => {
                log(
                  'warn',
                  `plugin ${record.id}: ${event.topic} failed: ${error instanceof Error ? error.message : 'failed'}`,
                );
              });
          }
        }
      });
    },
    start: async (): Promise<void> => {
      for (const record of await store.list()) {
        await scheduleAll(record);
      }
    },
    stop: (): void => {
      runtime.stopAll();
    },
  };
};

type PluginService = ReturnType<typeof createPluginService>;

export type { CreatePluginServiceOptions, PluginService };

export { createPluginService };
