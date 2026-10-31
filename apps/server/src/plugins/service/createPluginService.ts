import { asPersonLooking } from '@ValenceServer/plugins/broker/asPersonLooking';
import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { Said } from '@ValenceI18n/SaidSchema';
import { randomBytes, timingSafeEqual } from 'node:crypto';
import { readPluginPackage } from '@ValenceSDK/package/readPluginPackage';
import { sha256Of } from '@ValenceSDK/package/sha256Of';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import { createPluginBroker } from '@ValenceServer/plugins/broker/createPluginBroker';
import { createPluginFetch } from '@ValenceServer/plugins/network/createPluginFetch';
import { createConnectTickets } from '@ValenceServer/plugins/accounts/createConnectTickets';
import { createPluginOAuth } from '@ValenceServer/plugins/accounts/createPluginOAuth';
import type { Lapse } from '@ValenceServer/plugins/accounts/createPluginOAuth';
import { createPluginRuntime } from '@ValenceServer/plugins/runtime/createPluginRuntime';
import { cleanSurface } from '@ValenceServer/plugins/surfaces/cleanSurface';
import { serviceNotice } from '@ValenceServer/plugins/surfaces/serviceNotice';
import { satisfiesApiRange } from '@ValenceServer/plugins/install/satisfiesApiRange';
import { RESERVED_ACTIONS } from '@ValenceSDK/surface/RESERVED_ACTIONS';
import { narrowPicture } from '@ValenceServer/images/narrowPicture';
import { remoteImagesOf } from '@ValenceServer/plugins/surfaces/remoteImagesOf';
import { createDrawnPictures } from './createDrawnPictures';
import { isForThem } from './isForThem';
import { describeFailure } from '@ValenceServer/logging/describeFailure';
import { isSignedBy } from '@ValenceSDK/package/isSignedBy';
import { readSignatureFile } from '@ValenceSDK/package/readSignatureFile';
import { sealSecret } from '@ValenceServer/plugins/sealSecret';
import { openSecret } from '@ValenceServer/plugins/openSecret';
import { changeSettings } from './changeSettings';
import { carrySettings } from './carrySettings';
import { compareVersions } from '@ValenceSDK/package/compareVersions';
import { newestRunnable } from '@ValenceServer/plugins/catalogue/newestRunnable';
import { describeManifest } from './describeManifest';
import { summaryOf } from './summaryOf';
import { eventsFrom } from './eventsFrom';
import { isAboutViewing } from './isAboutViewing';
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
  PluginRemoval,
  PluginTrust,
} from '@ValenceContracts/schemas/Plugin';
import type { Surface } from '@ValenceSDK/surface/SurfaceSchema';
import type { SurfaceActRequest } from '@ValenceSDK/surface/SurfaceActRequestSchema';
import type { PluginPackage } from '@ValenceSDK/package/PluginPackageSchema';
import type { WebhookOccurrence } from '@ValenceServer/events/EventBus';
import type { MediaSegment } from '@ValenceContracts/schemas/MediaSegment';
import type { PluginEvent } from '@ValenceSDK/host/PluginDefinition';
import type { JsonValue } from '@ValenceContracts/schemas/JsonValue';
import type { CatalogueClient } from '@ValenceServer/plugins/catalogue/createCatalogueClient';
import type { PluginHost } from '@ValenceServer/plugins/broker/PluginHost';
import type { BrokerScope } from '@ValenceServer/plugins/broker/BrokerScope';
import type { InstalledRecord, PluginStore } from '@ValenceServer/plugins/store/PluginStore';
import type { CreatePluginRuntimeOptions } from '@ValenceServer/plugins/runtime/createPluginRuntime';
import type { PluginViewer } from './PluginViewer';
import type { TrustedKeys } from '@ValenceServer/plugins/keys/createTrustedKeys';
import { say } from '@ValenceI18n/say';
import { saying } from '@ValenceI18n/saying';
import { accountPageAddress } from '@ValenceServer/plugins/service/accountPageAddress';
import { createContributionCalls } from './createContributionCalls';
import { createPluginRoutes } from '@ValenceServer/plugins/routes/createPluginRoutes';
import { routesTakingAppPasswords } from '@ValenceServer/plugins/routes/routesTakingAppPasswords';
import { PANEL_PLACES } from '@ValenceSDK/manifest/PANEL_PLACES';
import { HomeRowAnswerSchema } from '@ValenceSDK/rows/HomeRowAnswerSchema';
import { HOME_ROW_LIMITS } from '@ValenceSDK/rows/HOME_ROW_LIMITS';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import type { Viewer } from '@ValenceServer/visibility/Viewer';
import { homeRowKey } from './homeRowKey';

type FetchFor = (
  pluginId: string,
  hosts: readonly string[],
) => ReturnType<typeof createPluginFetch>;

type CreatePluginServiceOptions = {
  store: PluginStore;
  host: PluginHost;
  catalogue: CatalogueClient;
  keys: Readonly<Record<string, string>>;
  trustedKeys?: Pick<TrustedKeys, 'all' | 'list' | 'save'>;
  sealingKey: Buffer;
  redirectUri: string;
  apiVersion: string;
  enqueueSchedule: (pluginId: string, scheduleId: string, afterSeconds: number) => Promise<void>;
  cancelJobs?: (pluginId: string) => Promise<void>;
  isJobCancelled?: (jobId: string) => boolean;
  eventRetryAfterMs?: readonly number[];
  summariesOf?: (
    viewer: Viewer,
    ids: readonly string[],
  ) => Promise<ReadonlyMap<string, MediaSummary>>;
  log: (level: 'info' | 'warn' | 'error', message: string) => void;
  announce?: (change: PluginChange) => void;
  fetchFor?: FetchFor;
  startSandbox?: CreatePluginRuntimeOptions['start'];
  segmentsOf?: (mediaId: string) => Promise<readonly MediaSegment[]>;
  onConnectionLapsed?: (lapse: {
    profileId: string;
    plugin: string;
    provider: string;
    link: string | null;
  }) => Promise<void>;
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

const NO_TRUSTED_KEYS: Pick<TrustedKeys, 'all' | 'list' | 'save'> = {
  all: () => Promise.resolve({}),
  list: () => Promise.resolve([]),
  save: () => Promise.resolve({ keys: [] }),
};

const IMAGE_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/avif']);

const WEBHOOK_WINDOW_MILLISECONDS = 60_000;

const MOST_WEBHOOKS_PER_WINDOW = 60;

const MOST_WAITING_EVENTS = 200;

const GOODBYE_MILLISECONDS = 10_000;

const FIRST_ROW_WAIT_MILLISECONDS = 5000;

const EVENT_RETRY_AFTER_MS = [10_000, 60_000];

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
  trustedKeys = NO_TRUSTED_KEYS,
  sealingKey,
  redirectUri,
  apiVersion,
  enqueueSchedule,
  cancelJobs = () => Promise.resolve(),
  isJobCancelled = () => false,
  eventRetryAfterMs = EVENT_RETRY_AFTER_MS,
  summariesOf = () => Promise.resolve(new Map()),
  log,
  announce = () => undefined,
  fetchFor = (pluginId, hosts) => createPluginFetch({ pluginId, hosts }),
  startSandbox,
  segmentsOf = () => Promise.resolve([]),
  onConnectionLapsed = () => Promise.resolve(),
  now = Date.now,
}: CreatePluginServiceOptions) => {
  const pending = new Map<string, Pending>();
  const unpacked = new Map<string, PluginPackage>();
  const upgrading = new Map<string, Promise<void>>();
  const emitted = new Map<string, number[]>();

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

  const creditsOf = async (occurrence: WebhookOccurrence): Promise<readonly MediaSegment[]> => {
    if (occurrence.event !== 'playback.stopped') {
      return [];
    }

    const hearsFinishing = (await store.list()).some(
      (record) =>
        record.isEnabled && record.manifest.contributes.events.includes('playback.finished'),
    );

    return hearsFinishing ? segmentsOf(occurrence.data.item.itemId).catch(() => []) : [];
  };

  let told: Promise<void> = Promise.resolve();

  const couldNotTell = (error: Error): void => {
    log('warn', `plugins could not be told of an event: ${describeFailure(error)}`);
  };

  const tickets = createConnectTickets({ now });

  const pictures = createDrawnPictures(now);

  const tellOfLapse = async ({ pluginId, profileId, provider }: Lapse) => {
    const record = await store.read(pluginId);
    const page = record?.manifest.contributes.pages.find(
      (contributed) => contributed.placement === 'account',
    );

    await onConnectionLapsed({
      profileId,
      plugin: record?.manifest.name ?? pluginId,
      provider: provider.name,
      link: page === undefined ? null : accountPageAddress(pluginId, page.id),
    });
  };

  const oauth = createPluginOAuth({
    redirectUri,
    store,
    onLapse: (lapse) => {
      void tellOfLapse(lapse).catch((error: Error) => {
        log(
          'warn',
          `plugin ${lapse.pluginId}: could not tell somebody their ${lapse.provider.name} connection lapsed: ${describeFailure(error)}`,
        );
      });

      return Promise.resolve();
    },
    seal: (secret) => sealSecret(sealingKey, secret),
    open: (sealed) => openSecret(sealingKey, sealed),
    exchange: async (pluginId, address, form) => {
      const record = await store.read(pluginId);

      if (record === null) {
        return { status: 404, text: '' };
      }

      const answered = await fetchFor(pluginId, hostsOf(record)).fetch(address, {
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

  const exclusively = async <T>(pluginId: string, work: () => Promise<T>): Promise<T> => {
    for (let held = upgrading.get(pluginId); held !== undefined; held = upgrading.get(pluginId)) {
      await held;
    }

    let finished: () => void = () => undefined;

    upgrading.set(
      pluginId,
      new Promise((resolve) => {
        finished = resolve;
      }),
    );

    try {
      return await work();
    } finally {
      upgrading.delete(pluginId);
      finished();
    }
  };

  const emittedBy = (pluginId: string): number[] => {
    const known = emitted.get(pluginId);

    if (known !== undefined) {
      return known;
    }

    const fresh: number[] = [];

    emitted.set(pluginId, fresh);

    return fresh;
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
        seal: (secret) => sealSecret(sealingKey, secret),
        open: (sealed) => openSecret(sealingKey, sealed),
        log: (level, message) => {
          log(level, `plugin ${record.id}: ${message}`);
        },
        emitted: emittedBy(record.id),
      }),
    onProblem: (pluginId, problem) => {
      log('warn', `plugin ${pluginId}: ${problem.message}`);
      void store.change(pluginId, { problem });
    },
    onLog: (pluginId, level, message) => {
      log(level, `plugin ${pluginId}: ${message}`);
    },
    ...(startSandbox === undefined ? {} : { start: startSandbox }),
  });

  const runnable = async (pluginId: string) => {
    await upgrading.get(pluginId);

    const record = await store.read(pluginId);

    if (record === null || !record.isEnabled) {
      return null;
    }

    const plugin = unpack(record);

    return plugin === null || plugin.code === undefined
      ? null
      : { record, plugin, code: plugin.code };
  };

  const contributionCalls = createContributionCalls({
    runnable,
    invoke: (plugin, handler, args) =>
      runtime.invoke({ record: plugin.record, code: plugin.code }, handler, args, {
        kind: 'background',
        profileId: null,
      }),
  });

  const pluginRoutes = createPluginRoutes({
    runnable,
    store,
    invoke: (plugin, args, scope) =>
      runtime.invoke({ record: plugin.record, code: plugin.code }, 'route', args, scope),
    readProfile: host.profiles.read,
    viewerOf: host.viewerOf,
    seal: (secret) => sealSecret(sealingKey, secret),
    open: (sealed) => openSecret(sealingKey, sealed),
    log,
    now,
  });

  const lines = new Map<string, Promise<void>>();

  const retries = new Set<NodeJS.Timeout>();

  let isStopped = false;

  const waitingEvents = new Map<string, number>();

  /**
   * Tells one plugin of one event in its turn, after everything it was told before, holding at most
   * two hundred waiting for any one plugin so a slow one falls behind on its own. An event its
   * handler fails on is told again after ten seconds and then a minute, except progress, which the
   * next one replaces.
   *
   * @param pluginId - The plugin.
   * @param event - What happened.
   * @param attempt - How many times it was told already.
   */
  const deliver = (pluginId: string, event: PluginEvent, attempt: number): void => {
    const waiting = waitingEvents.get(pluginId) ?? 0;

    if (waiting >= MOST_WAITING_EVENTS) {
      log('warn', `plugin ${pluginId}: ${event.topic} not told, too many events already waiting`);

      return;
    }

    waitingEvents.set(pluginId, waiting + 1);

    const turn = (lines.get(pluginId) ?? Promise.resolve())
      .then(async () => {
        const found = await runnable(pluginId);
        const { manifest } = found?.record ?? { manifest: null };
        const topic = manifest?.contributes.events.find((each) => each === event.topic);

        if (
          found === null ||
          topic === undefined ||
          !mayHearEvent(manifest?.permissions ?? [], topic)
        ) {
          return;
        }

        const hearsEverybody = found.record.manifest.permissions.some(
          (permission) => permission.kind === 'viewing' && permission.household === true,
        );

        await runtime.invoke(
          { record: found.record, code: found.code },
          'event',
          { event },
          {
            kind: 'background',
            profileId: event.topic === 'profile.removed' ? null : event.profileId,
            isHousehold: hearsEverybody && isAboutViewing(event.topic),
          },
        );
      })
      .catch((error) => {
        const wait = event.topic === 'playback.progress' ? undefined : eventRetryAfterMs[attempt];

        log(
          'warn',
          `plugin ${pluginId}: ${event.topic} failed${wait === undefined ? '' : ', telling it again shortly'}: ${error instanceof Error ? error.message : 'failed'}`,
        );

        if (wait !== undefined && !isStopped) {
          const timer = setTimeout(() => {
            retries.delete(timer);
            deliver(pluginId, event, attempt + 1);
          }, wait);

          timer.unref();
          retries.add(timer);
        }
      })
      .finally(() => {
        waitingEvents.set(pluginId, (waitingEvents.get(pluginId) ?? 1) - 1);
      });

    lines.set(pluginId, turn);
  };

  const inTurnPerPlugin = new Map<string, Promise<void>>();

  let telling: Promise<void> = Promise.resolve();

  /**
   * Hands events to each plugin's line in the order Valence learned of them, one batch after
   * another, so a batch that takes longer to sort out is never overtaken by the next.
   *
   * @param events - What happened.
   * @returns When they are all in their plugins' lines.
   */
  const tell = (events: readonly PluginEvent[]): Promise<void> => {
    const next = telling.then(() => sortOut(events));

    telling = next.catch(() => undefined);

    return next;
  };

  /**
   * Puts each event in the line of every plugin that may hear it.
   *
   * @param events - What happened.
   */
  const sortOut = async (events: readonly PluginEvent[]): Promise<void> => {
    if (events.length === 0) {
      return;
    }

    const tellOne = async (record: InstalledRecord): Promise<void> => {
      if (!record.isEnabled) {
        return;
      }

      const heard = events.filter((event) => {
        const topic = record.manifest.contributes.events.find((each) => each === event.topic);

        return topic !== undefined && mayHearEvent(record.manifest.permissions, topic);
      });

      if (heard.length === 0) {
        return;
      }

      const usedBy = await store.profilesOf(record.id);
      const accountsUsing = new Set(
        (await Promise.all(usedBy.map((profileId) => host.profiles.read(profileId)))).flatMap(
          (profile) => (profile === null ? [] : [profile.accountId]),
        ),
      );

      const hearsEverybody = record.manifest.permissions.some(
        (permission) => permission.kind === 'viewing' && permission.household === true,
      );

      for (const event of heard) {
        if (isForThem(event, new Set(usedBy), accountsUsing, hearsEverybody)) {
          deliver(record.id, event, 0);
        }
      }
    };

    await Promise.all((await store.list()).map(tellOne));
  };

  /**
   * Tells a plugin which of its settings an administrator just changed, by id, so it can act on
   * them. Whatever it does happens after the save, so a slow plugin never holds up the person
   * saving, and in the plugin's line with its events, so two saves in quick succession reach it
   * one after the other and in the order they were made.
   *
   * @param pluginId - The plugin.
   * @param changed - The ids of the settings that changed.
   * @returns When the plugin has been told, or has failed to hear it.
   */
  const tellSettingsChanged = (pluginId: string, changed: string[]): Promise<void> => {
    const turn = (lines.get(pluginId) ?? Promise.resolve())
      .then(async () => {
        const found = await runnable(pluginId);

        if (found === null) {
          return;
        }

        await runtime.invoke(
          { record: found.record, code: found.code },
          'settingsChanged',
          { change: { changed } },
          { kind: 'background', profileId: null },
        );
      })
      .catch((error) => {
        log(
          'warn',
          `plugin ${pluginId}: telling it its settings changed failed: ${error instanceof Error ? error.message : 'failed'}`,
        );
      });

    lines.set(pluginId, turn);

    return turn;
  };

  /**
   * Gives a plugin that is about to be removed ten seconds to tidy up after itself elsewhere, such
   * as signing out of a service, while it still has everything it kept. Removing it goes ahead
   * however that goes.
   *
   * @param pluginId - The plugin.
   */
  const sayGoodbye = async (pluginId: string): Promise<void> => {
    const found = await runnable(pluginId);

    if (found === null) {
      return;
    }

    const said = runtime
      .invoke(
        { record: found.record, code: found.code },
        'uninstalling',
        {},
        { kind: 'background', profileId: null },
      )
      .catch((error) => {
        log(
          'warn',
          `plugin ${pluginId}: tidying up before removal failed: ${error instanceof Error ? error.message : 'failed'}`,
        );
      });
    let timer: NodeJS.Timeout | undefined;

    await Promise.race([
      said,
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, GOODBYE_MILLISECONDS);
      }),
    ]);
    clearTimeout(timer);
  };

  const homeRowAnswers = new Map<string, Map<string, { items: string[]; at: number }>>();

  const homeRowsAsked = new Map<string, Promise<void>>();

  const homeRowLines = new Map<string, Promise<void>>();

  const homeRowGenerations = new Map<string, number>();

  const homeRowVersions = new Map<string, number>();

  /**
   * Asks a plugin for one person's row again, behind anything else that plugin is working out for
   * the home page, keeping its answer for the next time that person opens it. A row already being
   * asked for is not asked for twice, a failure is kept as an empty row for as long as an answer
   * would be, so a failing plugin is not asked on every visit, and an answer that arrives after the
   * plugin was turned off is dropped. The plugin may read the library as that person while it
   * answers, and do nothing else for them.
   *
   * @param pluginId - The plugin.
   * @param rowId - Its row.
   * @param profileId - Whose row it is.
   * @returns When it has its answer, or gave up.
   */
  const askForHomeRow = (pluginId: string, rowId: string, profileId: string): Promise<void> => {
    const key = homeRowKey(rowId, profileId);
    const slot = JSON.stringify([pluginId, key]);
    const asking = homeRowsAsked.get(slot);

    if (asking !== undefined) {
      return asking;
    }

    const generation = homeRowGenerations.get(pluginId) ?? 0;
    const version = homeRowVersions.get(slot) ?? 0;
    const keep = (items: string[]): void => {
      if (
        (homeRowGenerations.get(pluginId) ?? 0) !== generation ||
        (homeRowVersions.get(slot) ?? 0) !== version
      ) {
        return;
      }

      homeRowAnswers.set(
        pluginId,
        (homeRowAnswers.get(pluginId) ?? new Map<string, { items: string[]; at: number }>()).set(
          key,
          { items, at: now() },
        ),
      );
    };
    const asked = (homeRowLines.get(pluginId) ?? Promise.resolve())
      .then(async () => {
        const found = await runnable(pluginId);

        if (
          found === null ||
          !found.record.manifest.contributes.rows.some((row) => row.id === rowId)
        ) {
          return;
        }

        const answer = await runtime.invoke(
          { record: found.record, code: found.code },
          'row',
          { id: rowId, profileId },
          { kind: 'background', profileId, isHomeRow: true },
        );
        const read = HomeRowAnswerSchema.safeParse(JSON.parse(answer));

        if (!read.success) {
          log('warn', `plugin ${pluginId}: its row ${rowId} answered with something it may not`);
          keep([]);

          return;
        }

        keep(read.data.items);
      })
      .catch((error) => {
        log(
          'warn',
          `plugin ${pluginId}: its row ${rowId} failed: ${error instanceof Error ? error.message : 'failed'}`,
        );
        keep([]);
      })
      .finally(() => {
        if (homeRowsAsked.get(slot) === asked) {
          homeRowsAsked.delete(slot);
        }
      });

    homeRowsAsked.set(slot, asked);
    homeRowLines.set(pluginId, asked);

    return asked;
  };

  /**
   * Forgets every row a plugin answered, once it is turned off or removed.
   *
   * @param pluginId - The plugin.
   */
  const forgetHomeRows = (pluginId: string): void => {
    homeRowAnswers.delete(pluginId);
    homeRowLines.delete(pluginId);
    homeRowGenerations.set(pluginId, (homeRowGenerations.get(pluginId) ?? 0) + 1);
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
          profileId: null,
        },
      );

      return null;
    } catch (error) {
      return error instanceof Error && error.message !== ''
        ? error.message
        : say('common.itFailed');
    }
  };

  const hookBase = new URL(redirectUri).origin;

  const routesAddressOf = (pluginId: string): string =>
    `${hookBase}/api/plugins/${encodeURIComponent(pluginId)}/routes`;

  const heard = new Map<string, number[]>();

  const ensureHooks = async (record: InstalledRecord): Promise<void> => {
    const receives = record.manifest.permissions.some(
      (permission) => permission.kind === 'webhooks',
    );
    const declared = receives ? record.manifest.contributes.webhooks.map((hook) => hook.id) : [];
    const kept = await store.readHooks(record.id);

    for (const hookId of declared) {
      if (kept[hookId] === undefined) {
        await store.saveHook(record.id, hookId, randomBytes(24).toString('base64url'));
      }
    }

    await store.forgetHooksExcept(record.id, declared);
  };

  const addressesOf = async (record: InstalledRecord): Promise<InstalledPlugin['webhooks']> => {
    const kept = await store.readHooks(record.id);

    return record.manifest.contributes.webhooks.flatMap((hook) => {
      const secret = kept[hook.id];

      return secret === undefined
        ? []
        : [
            {
              id: hook.id,
              title: hook.title,
              url: `${hookBase}/api/plugins/${encodeURIComponent(record.id)}/hooks/${encodeURIComponent(hook.id)}/${secret}`,
            },
          ];
    });
  };

  const summarise = async (record: InstalledRecord, updateAvailable: string | null) =>
    summaryOf(
      record,
      upgrading.has(record.id) ? 'upgrading' : runtime.stateOf(record.id),
      updateAvailable,
      await addressesOf(record),
    );

  const isTooOften = (pluginId: string): boolean => {
    const since = now() - WEBHOOK_WINDOW_MILLISECONDS;
    const recent = (heard.get(pluginId) ?? []).filter((at) => at > since);
    const isOver = recent.length >= MOST_WEBHOOKS_PER_WINDOW;

    heard.set(pluginId, isOver ? recent : [...recent, now()]);

    return isOver;
  };

  const latestVersions = async (): Promise<Map<string, string>> => {
    const read = await catalogue.read();

    return new Map(
      (read.catalogue?.plugins ?? []).flatMap((entry): [string, string][] => {
        const runs = newestRunnable(entry, apiVersion);

        return runs === null ? [] : [[entry.id, runs.version]];
      }),
    );
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
  ): Promise<InstallPreview | { problem: Said }> => {
    const { manifest } = plugin;

    if (!satisfiesApiRange(manifest.apiVersion, apiVersion)) {
      return {
        problem: saying('server.service.pluginService.nameWasWrittenForPluginAPI', {
          plugin: manifest.name,
          wanted: manifest.apiVersion,
          offered: apiVersion,
        }),
      };
    }

    const existing = await store.read(manifest.id);

    if (existing?.trust === 'official' && trust !== 'official') {
      return {
        problem: saying('server.service.pluginService.anUnsignedPackageCannotReplaceOfficial', {
          plugin: existing.manifest.name,
        }),
      };
    }

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
      ...(existing !== null && compareVersions(manifest.version, existing.version) < 0
        ? [
            say('server.service.pluginService.versionIsOlderThanTheInstalled', {
              version: manifest.version,
              installed: existing.version,
            }),
          ]
        : []),
      ...(widened.length === 0
        ? []
        : [
            say('server.service.pluginService.thisVersionAsksForMoreThan', {
              permissions: widened.map((each) => each.kind).join(', '),
            }),
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

  const mayBeShown = async (
    subject: { kind: string; id: string },
    viewer: PluginViewer,
  ): Promise<boolean> => {
    if (subject.kind === 'playlist') {
      return (
        (await host.playlists
          .read(asPersonLooking(viewer, viewer.reads), subject.id)
          .catch(() => null)) !== null
      );
    }

    const place = PANEL_PLACES.find((each) => each === subject.kind);

    if (place === undefined || place === 'playlist') {
      return false;
    }

    return host.library.sees({ kind: place, id: subject.id }, viewer.reads);
  };

  const draw = async (
    pluginId: string,
    at: Surroundings,
    viewer: PluginViewer,
    act: SurfaceActRequest | null,
  ): Promise<{ surface: Surface; navigate: string | null } | null> => {
    if (upgrading.has(pluginId)) {
      const record = await store.read(pluginId);

      return record === null
        ? null
        : {
            surface: serviceNotice(
              say('server.service.pluginService.nameIsBeingUpdated', {
                name: record.manifest.name,
              }),
              say('server.service.pluginService.tryAgainInAMoment'),
            ),
            navigate: null,
          };
    }

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

    if (
      ('on' in contributed && at.subject?.kind !== contributed.on) ||
      (at.subject !== null && !(await mayBeShown(at.subject, viewer)))
    ) {
      return null;
    }

    if (at.kind === 'page') {
      await store.rememberProfile(record.id, viewer.profileId);
    }

    const scope: BrokerScope = {
      kind: 'viewer',
      profileId: viewer.profileId,
      accountId: viewer.accountId,
      isAdmin: viewer.isAdmin,
      reads: viewer.reads,
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
            `plugin ${record.id}: sent a ${at.kind} Valence would not draw: ${cleaned.problem.message}`,
          );
        }

        return cleaned.surface;
      } catch (error) {
        log(
          'warn',
          `plugin ${record.id}: ${error instanceof Error ? error.message : 'failed to draw'}`,
        );

        return serviceNotice(
          say('server.service.pluginService.nameIsNotAnswering', {
            name: record.manifest.name,
          }),
          say('server.service.pluginService.tryAgainInAMoment'),
        );
      }
    };

    if (act === null) {
      return { surface: await render(), navigate: null };
    }

    const provider = act.action.payload?.['provider'];

    if (act.action.id === RESERVED_ACTIONS.connect && typeof provider === 'string') {
      const ticket = tickets.issue({
        accountId: viewer.accountId,
        profileId: viewer.profileId,
        pluginId: record.id,
        provider,
        returnTo:
          'placement' in contributed && contributed.placement === 'account'
            ? accountPageAddress(record.id, at.id)
            : '/',
      });

      return {
        surface: await render(),
        navigate: `/api/plugins/${encodeURIComponent(record.id)}/accounts/${encodeURIComponent(provider)}/connect?ticket=${ticket}`,
      };
    }

    if (act.action.id === RESERVED_ACTIONS.disconnect && typeof provider === 'string') {
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
          `plugin ${record.id}: answered an action with something Valence would not draw: ${cleaned.problem.message}`,
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
          say('server.service.pluginService.nameCouldNotDoThat', {
            name: record.manifest.name,
          }),
          say('server.service.pluginService.tryAgainInAMoment'),
        ),
        navigate: null,
      };
    }
  };

  return {
    redirectUri,
    listTrustedKeys: trustedKeys.list,
    saveTrustedKeys: async (asked: Parameters<TrustedKeys['save']>[0]) => {
      const saved = await trustedKeys.save(asked);

      if ('keys' in saved) {
        log(
          'info',
          `trusted signing keys are now ${saved.keys.map((key) => key.id).join(', ') || 'none'}`,
        );
      }

      return saved;
    },
    listInstalled: async (): Promise<InstalledPlugin[]> => {
      const latest = await latestVersions();

      return Promise.all(
        (await store.list()).map((record) => {
          const newer = latest.get(record.id);

          return summarise(
            record,
            newer !== undefined && compareVersions(newer, record.version) > 0 ? newer : null,
          );
        }),
      );
    },
    readCatalogue: async (): Promise<CatalogueListing> => {
      const read = await catalogue.read();
      const installed = new Map((await store.list()).map((record) => [record.id, record.version]));

      return {
        isReachable: read.catalogue !== null,
        problem: read.problem,
        signedBy: read.signedBy,
        plugins: (read.catalogue?.plugins ?? []).map((entry) => {
          const runs = newestRunnable(entry, apiVersion);

          return {
            id: entry.id,
            name: entry.name,
            description: entry.description,
            author: entry.author,
            version: (runs ?? entry).version,
            kinds: entry.kinds,
            permissions: (runs ?? entry).permissions,
            iconUrl: entry.iconUrl ?? null,
            sourceUrl: entry.sourceUrl,
            installedVersion: installed.get(entry.id) ?? null,
            isCompatible: runs !== null,
          };
        }),
      };
    },
    previewFromCatalogue: async (
      id: string,
      accountId: string,
    ): Promise<InstallPreview | { problem: Said }> => {
      const read = await catalogue.read();
      const listed = read.catalogue?.plugins.find((each) => each.id === id);
      const entry =
        listed === undefined ? undefined : (newestRunnable(listed, apiVersion) ?? listed);

      if (entry === undefined) {
        return {
          problem: read.problem ?? saying('server.service.pluginService.theCatalogueHasNoPluginBy'),
        };
      }

      const fetched = await catalogue.fetchPackage(entry);

      if ('problem' in fetched) {
        return fetched;
      }

      const opened = readPluginPackage(fetched.bytes);

      if (!opened.ok) {
        return { problem: sayVerbatim(opened.problem) };
      }

      if (
        opened.plugin.manifest.id !== entry.id ||
        opened.plugin.manifest.version !== entry.version
      ) {
        return {
          problem: saying('server.service.pluginService.nameIsNotThePluginThe', {
            name: entry.name,
          }),
        };
      }

      return prepare(fetched.bytes, opened.plugin, fetched.signedBy, accountId, []);
    },
    previewUpload: async (
      bytes: Uint8Array,
      signature: string | null,
      accountId: string,
    ): Promise<InstallPreview | { problem: Said }> => {
      const opened = readPluginPackage(bytes);

      if (!opened.ok) {
        return { problem: sayVerbatim(opened.problem) };
      }

      const read = signature === null ? null : readSignatureFile(signature);
      const signedBy =
        read === null ? null : isSignedBy(bytes, read, { ...(await trustedKeys.all()), ...keys });

      return prepare(
        bytes,
        opened.plugin,
        signedBy === null ? 'unsigned' : Object.hasOwn(keys, signedBy) ? 'official' : 'trusted',
        accountId,
        signature !== null && signedBy === null
          ? [say('server.service.pluginService.theSignatureThatCameWithIt')]
          : [],
      );
    },
    install: async (
      asked: { token: string; permissionsHash: string; acceptUnsigned: boolean },
      accountId: string,
    ): Promise<InstalledPlugin | { refused: Said }> => {
      const waiting = pending.get(asked.token);

      if (waiting === undefined || waiting.expiresAt < now() || waiting.accountId !== accountId) {
        return {
          refused: saying('server.service.pluginService.thatPreviewHasExpiredLookAt'),
        };
      }

      if (waiting.permissionsHash !== asked.permissionsHash) {
        return {
          refused: saying('server.service.pluginService.thePermissionsAcceptedAreNotThe'),
        };
      }

      if (waiting.trust === 'unsigned' && !asked.acceptUnsigned) {
        return {
          refused: saying('server.service.pluginService.anUnsignedPluginIsOnlyInstalled'),
        };
      }

      pending.delete(asked.token);

      const { manifest } = waiting.plugin;

      const done = await exclusively(
        manifest.id,
        async (): Promise<{ saved: InstalledRecord } | { refused: Said }> => {
          const existing = await store.read(manifest.id);

          if (existing?.trust === 'official' && waiting.trust !== 'official') {
            return {
              refused: saying(
                'server.service.pluginService.anUnsignedPackageCannotReplaceOfficial',
                {
                  plugin: existing.manifest.name,
                },
              ),
            };
          }

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
            settings:
              existing === null
                ? {}
                : carrySettings(existing.manifest, manifest, existing.settings),
            installedBy: accountId,
          });
          runtime.stop(manifest.id);
          forgetHomeRows(manifest.id);

          const problem =
            upgradesFrom === null
              ? null
              : await bringDataUpToDate(manifest.id, { from: upgradesFrom, to: manifest.version });

          if (upgradesFrom !== null && problem !== null) {
            runtime.stop(manifest.id);

            const isBack = await store.restorePrevious(manifest.id);

            if (!isBack) {
              await store.change(manifest.id, { isEnabled: false });
            }

            log(
              'warn',
              isBack
                ? `plugin ${manifest.id}: ${manifest.version} could not bring its data up to date, so ${upgradesFrom} was put back: ${problem}`
                : `plugin ${manifest.id}: ${manifest.version} could not bring its data up to date, and ${upgradesFrom} could not be put back, so it was turned off: ${problem}`,
            );
            announce({ pluginId: manifest.id, change: isBack ? 'updated' : 'disabled' });

            return {
              refused: saying(
                isBack
                  ? 'server.service.pluginService.nameVersionCouldNotBringIts'
                  : 'server.service.pluginService.nameVersionCouldNotBringItsAndWasTurnedOff',
                { name: manifest.name, version: manifest.version, upgradesFrom, problem },
              ),
            };
          }

          if (existing !== null && existing.trust !== 'official' && waiting.trust === 'official') {
            await store.forgetPrevious(manifest.id);
          }

          const saved = await store.read(manifest.id);

          if (saved === null) {
            return { refused: saying('server.service.pluginService.thePluginCouldNotBeKept') };
          }

          log('info', `plugin ${manifest.id}: installed ${manifest.version} (${waiting.trust})`);
          await scheduleAll(saved);
          announce({ pluginId: manifest.id, change: existing === null ? 'installed' : 'updated' });

          await ensureHooks(saved);

          return { saved };
        },
      );

      return 'refused' in done ? done : summarise(done.saved, null);
    },
    change: async (
      id: string,
      changes: {
        isEnabled?: boolean | undefined;
        settings?: Record<string, string | boolean | number | null> | undefined;
      },
    ): Promise<InstalledPlugin | { refused: Said } | null> => {
      const done = await exclusively(
        id,
        async (): Promise<{ saved: InstalledRecord } | { refused: Said } | null> => {
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

          if (changes.isEnabled === false && record.isEnabled) {
            await cancelJobs(id).catch(() => undefined);
            forgetHomeRows(id);
          }

          const changed = saved.manifest.settings.flatMap((setting) =>
            setting.kind === 'secret'
              ? typeof changes.settings?.[setting.id] === 'string'
                ? [setting.id]
                : []
              : saved.settings[setting.id] === record.settings[setting.id]
                ? []
                : [setting.id],
          );

          if (changed.length > 0 && saved.isEnabled) {
            void tellSettingsChanged(id, changed);
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

          await ensureHooks(saved);

          return { saved };
        },
      );

      return done === null || 'refused' in done ? done : summarise(done.saved, null);
    },
    rollback: async (id: string): Promise<InstalledPlugin | { refused: Said } | null> => {
      const done = await exclusively(
        id,
        async (): Promise<{ saved: InstalledRecord } | { refused: Said } | null> => {
          const record = await store.read(id);

          if (record === null) {
            return null;
          }

          if (record.previousVersion === null) {
            return { refused: saying('server.service.pluginService.noEarlierVersionOfThisPlugin') };
          }

          runtime.stop(id);
          forgetHomeRows(id);

          if (!(await store.restorePrevious(id))) {
            return { refused: saying('common.theEarlierVersionCouldNotBe') };
          }

          const saved = await store.read(id);

          if (saved === null) {
            return null;
          }

          await scheduleAll(saved);
          log('info', `plugin ${id}: rolled back from ${record.version} to ${saved.version}`);
          announce({ pluginId: id, change: 'updated' });

          await ensureHooks(saved);

          return { saved };
        },
      );

      return done === null || 'refused' in done ? done : summarise(done.saved, null);
    },
    removal: async (id: string): Promise<PluginRemoval | null> => {
      const record = await store.read(id);

      if (record === null) {
        return null;
      }

      const connections = await store.connectionsOf(id);
      const accounts = record.manifest.permissions.flatMap((permission) =>
        permission.kind === 'accounts' ? permission.providers : [],
      );

      return {
        bytesKept: await store.bytesKept(id),
        people: (await store.profilesOf(id)).length,
        accounts: accounts
          .map((provider) => ({
            provider: provider.name,
            connected: connections.filter((connection) => connection.provider === provider.id)
              .length,
            isRevoked: provider.revokeUrl !== undefined,
          }))
          .filter((account) => account.connected > 0),
        themes: record.manifest.contributes.themes.length,
        nodes: record.manifest.contributes.nodes.length,
        webhooks: record.manifest.contributes.webhooks.length,
        appPasswords: await store.credentialCountOf(id),
        keepsEarlierVersion: record.previousVersion !== null,
      };
    },
    uninstall: async (id: string): Promise<boolean> => {
      await sayGoodbye(id);

      return exclusively(id, async () => {
        runtime.stop(id);

        const record = await store.read(id);
        const revocations =
          record === null
            ? []
            : await Promise.all(
                (await store.connectionsOf(id)).map(async (connection) => {
                  const found = credentialsFor(record, connection.provider);

                  return found === null ||
                    found.credentials === null ||
                    found.provider.revokeUrl === undefined
                    ? null
                    : oauth.revoke(connection, found.provider, found.credentials);
                }),
              );
        const asked = revocations.filter((revoked) => revoked !== null);

        if (asked.length > 0) {
          log(
            'info',
            `plugin ${id}: ${asked.filter(Boolean).length} of ${asked.length} connected accounts revoked`,
          );
        }

        const removed = await store.remove(id);

        runtime.stop(id);
        pictures.forget(id);
        lines.delete(id);
        waitingEvents.delete(id);
        forgetHomeRows(id);
        await cancelJobs(id).catch(() => undefined);

        if (removed) {
          log('info', `plugin ${id}: uninstalled`);
          announce({ pluginId: id, change: 'removed' });
        }

        return removed;
      });
    },
    homeRows: async (viewer: Pick<PluginViewer, 'reads'>) => {
      if (viewer.reads.kind !== 'account' || viewer.reads.profileId === null) {
        return [];
      }

      const profileId = viewer.reads.profileId;
      const chosen = await store.homeRowsOf(profileId);

      if (chosen.length === 0) {
        return [];
      }

      const plugins = new Map((await store.manifests()).map((each) => [each.id, each]));
      const drawn = chosen.flatMap(({ pluginId, rowId }) => {
        const plugin = plugins.get(pluginId);
        const declared = plugin?.isEnabled
          ? plugin.manifest.contributes.rows.find((row) => row.id === rowId)
          : undefined;

        if (plugin === undefined || declared === undefined) {
          return [];
        }

        const kept = homeRowAnswers.get(pluginId)?.get(homeRowKey(rowId, profileId));

        if (kept === undefined || now() - kept.at > HOME_ROW_LIMITS.freshMinutes * 60_000) {
          void askForHomeRow(pluginId, rowId, profileId);
        }

        return kept === undefined || kept.items.length === 0
          ? []
          : [
              {
                pluginId,
                pluginName: plugin.manifest.name,
                rowId,
                title: declared.title,
                ids: kept.items,
              },
            ];
      });
      const cards = await summariesOf(
        viewer.reads,
        drawn.flatMap((row) => row.ids),
      );

      return drawn.flatMap(({ ids, ...row }) => {
        const items = ids.flatMap((id) => {
          const card = cards.get(id);

          return card === undefined ? [] : [card];
        });

        return items.length === 0 ? [] : [{ ...row, items }];
      });
    },
    homeRowChoices: async (viewer: Pick<PluginViewer, 'reads'>) => {
      if (viewer.reads.kind !== 'account' || viewer.reads.profileId === null) {
        return [];
      }

      const chosen = await store.homeRowsOf(viewer.reads.profileId);

      return (await store.manifests())
        .filter((plugin) => plugin.isEnabled)
        .flatMap((plugin) =>
          plugin.manifest.contributes.rows.map((row) => ({
            pluginId: plugin.id,
            pluginName: plugin.manifest.name,
            rowId: row.id,
            title: row.title,
            isChosen: chosen.some((each) => each.pluginId === plugin.id && each.rowId === row.id),
          })),
        );
    },
    chooseHomeRow: async (
      pluginId: string,
      rowId: string,
      viewer: Pick<PluginViewer, 'reads'>,
      isChosen: boolean,
    ): Promise<boolean> => {
      if (viewer.reads.kind !== 'account' || viewer.reads.profileId === null) {
        return false;
      }

      const profileId = viewer.reads.profileId;

      if (!isChosen) {
        const slot = JSON.stringify([pluginId, homeRowKey(rowId, profileId)]);

        await store.chooseHomeRow(pluginId, profileId, rowId, false);
        homeRowAnswers.get(pluginId)?.delete(homeRowKey(rowId, profileId));
        homeRowsAsked.delete(slot);
        homeRowVersions.set(slot, (homeRowVersions.get(slot) ?? 0) + 1);

        return true;
      }

      const plugin = (await store.manifests()).find((each) => each.id === pluginId);

      if (
        plugin === undefined ||
        !plugin.isEnabled ||
        !plugin.manifest.contributes.rows.some((row) => row.id === rowId)
      ) {
        return false;
      }

      await store.chooseHomeRow(pluginId, profileId, rowId, true);

      const kept = homeRowAnswers.get(pluginId)?.get(homeRowKey(rowId, profileId));

      if (kept === undefined || now() - kept.at > HOME_ROW_LIMITS.freshMinutes * 60_000) {
        let timer: NodeJS.Timeout | undefined;

        await Promise.race([
          askForHomeRow(pluginId, rowId, profileId),
          new Promise<void>((resolve) => {
            timer = setTimeout(resolve, FIRST_ROW_WAIT_MILLISECONDS);
          }),
        ]);
        clearTimeout(timer);
      }

      return true;
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
        downloadClients: enabled.flatMap((record) =>
          record.manifest.contributes.downloadClients.map((client) => ({
            pluginId: record.id,
            pluginName: record.manifest.name,
            clientId: client.id,
            title: client.title,
            protocol: client.protocol,
          })),
        ),
        sources: enabled.flatMap((record) =>
          record.manifest.contributes.sources.map((source) => ({
            pluginId: record.id,
            pluginName: record.manifest.name,
            sourceId: source.id,
            title: source.title,
          })),
        ),
        apps: enabled.flatMap((record) =>
          routesTakingAppPasswords(record).length > 0
            ? [{ pluginId: record.id, pluginName: record.manifest.name }]
            : [],
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
    downloadClient: contributionCalls.downloadClient,
    source: contributionCalls.source,
    linkHostsOf: contributionCalls.linkHostsOf,
    answerRoute: pluginRoutes.answer,
    appPasswords: async (pluginId: string, profileId: string) => {
      const kept = await pluginRoutes.credentialsOf(pluginId, profileId);

      return kept === null
        ? null
        : {
            address: routesAddressOf(pluginId),
            routes: kept.routes,
            passwords: kept.credentials,
          };
    },
    makeAppPassword: async (pluginId: string, profileId: string, label: string) => {
      const profile = await host.profiles.read(profileId);

      if (profile === null) {
        return 'unknown';
      }

      const made = await pluginRoutes.makeCredential(pluginId, profile, label);

      return typeof made === 'string'
        ? made
        : { address: routesAddressOf(pluginId), password: made.credential, secret: made.secret };
    },
    forgetAppPassword: pluginRoutes.forgetCredential,
    render: async (pluginId: string, at: Surroundings, viewer: PluginViewer) => {
      const drawn = await draw(pluginId, at, viewer, null);

      if (drawn !== null) {
        pictures.remember(pluginId, viewer.profileId, remoteImagesOf(drawn.surface));
      }

      return drawn;
    },
    act: async (
      pluginId: string,
      at: Surroundings,
      viewer: PluginViewer,
      request: SurfaceActRequest,
    ): Promise<PluginActAnswer | null> => {
      const answered = await draw(pluginId, at, viewer, request);

      if (answered === null) {
        return null;
      }

      const surface = SurfaceSchema.parse(answered.surface);

      pictures.remember(pluginId, viewer.profileId, remoteImagesOf(surface));

      return { surface, navigate: answered.navigate };
    },
    asset: async (
      pluginId: string,
      name: string,
    ): Promise<{ body: Buffer; contentType: string } | null> => {
      const record = await store.read(pluginId);
      const plugin = record === null ? null : unpack(record);
      const encoded =
        record?.isEnabled === true || record?.manifest.icon === name
          ? plugin?.assets[name]
          : undefined;
      const extension = name.split('.').pop() ?? '';
      const contentType = ASSET_TYPES[extension];

      return encoded === undefined || contentType === undefined
        ? null
        : { body: Buffer.from(encoded, 'base64'), contentType };
    },
    image: async (
      pluginId: string,
      url: string,
      viewer: Pick<PluginViewer, 'profileId'>,
      width?: number,
    ): Promise<{ body: Buffer; contentType: string } | 'tooOften' | null> => {
      const record = await store.read(pluginId);

      if (
        record === null ||
        !record.isEnabled ||
        !pictures.wasDrawn(pluginId, viewer.profileId, url)
      ) {
        return null;
      }

      if (!pictures.mayFetch(pluginId, viewer.profileId)) {
        return 'tooOften';
      }

      try {
        const answer = await fetchFor(record.id, hostsOf(record)).fetchBytes(url);
        const contentType = (answer.headers['content-type'] ?? '').split(';')[0]?.trim() ?? '';

        if (answer.status !== 200 || !IMAGE_TYPES.has(contentType)) {
          return null;
        }

        const narrowed =
          width === undefined || contentType === 'image/gif'
            ? null
            : await narrowPicture(answer.body, width);

        return narrowed === null
          ? { body: answer.body, contentType }
          : { body: narrowed, contentType: 'image/webp' };
      } catch {
        return null;
      }
    },
    connect: async (
      pluginId: string,
      providerId: string,
      asked: { ticket: string | null; viewer: PluginViewer | null; returnTo: string },
    ): Promise<{ location: string; browser: string } | { problem: Said }> => {
      const ticket =
        asked.ticket === null ? null : tickets.redeem(asked.ticket, pluginId, providerId);

      if (asked.ticket !== null && ticket === null) {
        return { problem: saying('server.service.pluginService.thatLinkHasExpiredGoBack') };
      }

      const profileId = ticket?.profileId ?? asked.viewer?.profileId ?? null;

      if (profileId === null) {
        return { problem: saying('server.service.pluginService.signInToValenceFirst') };
      }

      const record = await store.read(pluginId);

      if (record === null || !record.isEnabled) {
        return { problem: saying('server.service.pluginService.thereIsNoSuchPlugin') };
      }

      const found = credentialsFor(record, providerId);

      if (found === null) {
        return {
          problem: saying('server.service.pluginService.nameHasNoAccountCalledProviderId', {
            name: record.manifest.name,
            providerId,
          }),
        };
      }

      if (found.credentials === null) {
        return {
          problem: saying('server.service.pluginService.anAdministratorHasNotGivenName', {
            plugin: record.manifest.name,
            service: found.provider.name,
          }),
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
                  { kind: 'background', profileId: finished.profileId },
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
          { kind: 'background', profileId: null },
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
    runJob: async (
      jobId: string,
      job: { pluginId: string; kind: string; payload: JsonValue; profileId: string | null },
      attempt: number,
    ): Promise<void> => {
      const ahead = inTurnPerPlugin.get(job.pluginId) ?? Promise.resolve();
      const run = ahead.then(async () => {
        const found = await runnable(job.pluginId);

        if (
          found === null ||
          isJobCancelled(jobId) ||
          !found.record.manifest.contributes.jobs.some((each) => each.id === job.kind)
        ) {
          return;
        }

        await runtime.invoke(
          { record: found.record, code: found.code },
          'job',
          {
            job: { id: jobId, kind: job.kind, attempt, profileId: job.profileId },
            payload: job.payload,
          },
          { kind: 'background', profileId: job.profileId, jobId },
        );
      });
      const settled = run.then(
        () => undefined,
        () => undefined,
      );

      inTurnPerPlugin.set(job.pluginId, settled);

      try {
        await run;
      } finally {
        if (inTurnPerPlugin.get(job.pluginId) === settled) {
          inTurnPerPlugin.delete(job.pluginId);
        }
      }
    },
    tellOf: (events: readonly PluginEvent[]): void => {
      void tell(events).catch(couldNotTell);
    },
    dispatch: (occurrence: WebhookOccurrence): void => {
      const at = new Date(now()).toISOString();

      const segments = told.then(() => creditsOf(occurrence));

      told = segments.then(
        () => undefined,
        () => undefined,
      );
      void segments
        .catch(() => [])
        .then((found) => tell(eventsFrom(occurrence, at, found)))
        .catch(couldNotTell);
    },
    profilesRemoved: (profileIds: readonly string[]): void => {
      const at = new Date(now()).toISOString();

      void tell(
        profileIds.map((profileId) => ({
          topic: 'profile.removed',
          occurredAt: at,
          profileId,
          mediaId: null,
          positionSeconds: null,
          durationSeconds: null,
        })),
      ).catch(couldNotTell);
    },
    receiveWebhook: async (
      pluginId: string,
      hookId: string,
      secret: string,
      request: { headers: Record<string, string>; body: string },
    ): Promise<'accepted' | 'unknown' | 'limited' | 'failed'> => {
      const found = await runnable(pluginId);
      const kept = found === null ? undefined : (await store.readHooks(pluginId))[hookId];

      if (
        found === null ||
        kept === undefined ||
        !found.record.manifest.contributes.webhooks.some((hook) => hook.id === hookId) ||
        !found.record.manifest.permissions.some((permission) => permission.kind === 'webhooks') ||
        kept.length !== secret.length ||
        !timingSafeEqual(Buffer.from(kept), Buffer.from(secret))
      ) {
        return 'unknown';
      }

      if (isTooOften(pluginId)) {
        return 'limited';
      }

      try {
        await runtime.invoke(
          { record: found.record, code: found.code },
          'webhook',
          { id: hookId, request: { ...request, receivedAt: new Date(now()).toISOString() } },
          { kind: 'background', profileId: null },
        );

        return 'accepted';
      } catch (error) {
        log(
          'warn',
          `plugin ${pluginId}: webhook ${hookId} failed: ${error instanceof Error ? error.message : 'failed'}`,
        );

        return 'failed';
      }
    },
    start: async (): Promise<void> => {
      for (const record of await store.list()) {
        await ensureHooks(record);
        await scheduleAll(record);
      }
    },
    stop: (): void => {
      isStopped = true;

      for (const timer of retries) {
        clearTimeout(timer);
      }

      retries.clear();
      runtime.stopAll();
    },
  };
};

type PluginService = ReturnType<typeof createPluginService>;

export type { CreatePluginServiceOptions, PluginService };

export { createPluginService };
