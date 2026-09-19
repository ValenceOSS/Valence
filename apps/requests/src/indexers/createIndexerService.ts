import { randomUUID } from 'node:crypto';
import { IndexerDraftSchema, ReleaseSearchSchema } from '@ValenceContracts/schemas/Indexer';
import { settingsOf } from '@ValenceRequests/cardigann/settingsOf';
import { isSecretSetting } from '@ValenceRequests/definitions/isSecretSetting';
import { CaptchaNeeded } from '@ValenceRequests/indexers/CaptchaNeeded';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import type {
  Indexer,
  IndexerChange,
  IndexerDraft,
  IndexerHealth,
  IndexerSettings,
  IndexerTest,
  ReleaseSearch,
  ReleaseSearchOutcome,
} from '@ValenceContracts/schemas/Indexer';
import type { CardigannDefinition } from '@ValenceRequests/cardigann/CardigannDefinitionSchema';
import type { SiteSession } from '@ValenceRequests/cardigann/SiteSession';
import type { IndexerClient } from '@ValenceRequests/indexers/createIndexerClient';
import type { IndexerRecord, IndexerStore } from '@ValenceRequests/indexers/IndexerRecord';
import type { ReleaseFile } from '@ValenceRequests/indexers/ReleaseFile';

type CreateIndexerServiceOptions = {
  store: IndexerStore;
  client: IndexerClient;
  definitions?: (id: string) => Promise<CardigannDefinition | null>;
  now?: () => Date;
  turnOffAfter?: number;
  failingAfter?: number;
};

const TURN_OFF_AFTER = 5;

const FAILING_AFTER = 3;

const UNASKABLE = 'The indexer could not be asked';

const CAPTCHA = 'CAPTCHA';

const MOST_DRAFT_SESSIONS = 50;

/**
 * The names of a definition's secret settings.
 *
 * @param definition - The definition, where there is one.
 * @returns The names.
 */
const secretsOf = (definition: CardigannDefinition | null): Set<string> =>
  new Set(
    definition === null
      ? []
      : settingsOf(definition)
          .filter(isSecretSetting)
          .map((setting) => setting.name),
  );

/**
 * Settings as they should be kept: changes laid over what was kept before, with a secret left blank
 * keeping the value it had, and the one-off captcha answer never kept at all.
 *
 * @param kept - The settings before.
 * @param given - What was sent.
 * @param secrets - Which settings are secret.
 * @returns The settings to keep.
 */
const mergeSettings = (
  kept: IndexerSettings,
  given: IndexerSettings,
  secrets: ReadonlySet<string>,
): IndexerSettings =>
  Object.fromEntries(
    Object.entries({ ...kept, ...given })
      .filter(
        ([name, value]) =>
          name !== CAPTCHA && !(secrets.has(name) && value === '' && kept[name] === undefined),
      )
      .map(([name, value]) => [
        name,
        secrets.has(name) && value === '' ? (kept[name] ?? '') : value,
      ]),
  );

/**
 * Keeps the indexers, tries them, searches every one that is on at once, and fetches what they
 * found.
 *
 * An indexer that keeps failing is turned off rather than asked forever, with the reason kept beside
 * it: after a few failures in a row it counts as failing, which the server hears about, and after a
 * few more it is switched off. Any answer at all clears the count, and switching one back on by hand
 * clears the reason. A site asking for a captcha is not a failure; it is a question for whoever is
 * setting it up.
 *
 * Nothing secret is ever shown back — not the API key, and not a definition's password, key or
 * cookie settings, which are listed only as being set. A logged-in site's session is kept between
 * searches, and forgotten when its address or settings change.
 *
 * @param store - Where indexers are kept.
 * @param client - How to ask them.
 * @param definitions - Where to find a definition by its id.
 * @param now - The clock.
 * @param turnOffAfter - How many failures in a row switch an indexer off.
 * @param failingAfter - How many failures in a row count as failing.
 * @returns The service.
 */
const createIndexerService = ({
  store,
  client,
  definitions = () => Promise.resolve(null),
  now = () => new Date(),
  turnOffAfter = TURN_OFF_AFTER,
  failingAfter = FAILING_AFTER,
}: CreateIndexerServiceOptions) => {
  const draftSessions = new Map<string, SiteSession>();

  const definitionOf = (record: Pick<IndexerRecord, 'kind' | 'definitionId'>) =>
    record.kind === 'cardigann' && record.definitionId !== null
      ? definitions(record.definitionId)
      : Promise.resolve(null);

  const shown = async (record: IndexerRecord): Promise<Indexer> => {
    const definition = await definitionOf(record);
    const secrets = secretsOf(definition);
    const { settings } = record;

    return {
      id: record.id,
      name: record.name,
      kind: record.kind,
      url: record.url,
      hasApiKey: record.apiKey !== '',
      definitionId: record.definitionId,
      settings: Object.fromEntries(
        Object.entries(settings).filter(([name]) => !secrets.has(name) && name !== CAPTCHA),
      ),
      secretsSet: [...secrets].filter(
        (name) => settings[name] !== undefined && settings[name] !== '',
      ),
      privacy:
        definition === null
          ? null
          : definition.type === 'public' || definition.type === 'semi-private'
            ? definition.type
            : 'private',
      priority: record.priority,
      isEnabled: record.isEnabled,
      categories: record.categories,
      requestsPerMinute: record.requestsPerMinute,
      timeoutSeconds: record.timeoutSeconds,
      capabilities: record.capabilities,
      failures: record.failures,
      lastProblem: record.lastProblem,
      lastFailedAt: record.lastFailedAt,
      turnedOffBecause: record.turnedOffBecause,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  };

  const succeeded = async (record: IndexerRecord, changes: Partial<IndexerRecord> = {}) => {
    await store.update(record.id, {
      ...changes,
      session: record.session,
      failures: 0,
      lastProblem: null,
      ...(record.failures > 0 || Object.keys(changes).length > 0
        ? { updatedAt: now().toISOString() }
        : {}),
    });
  };

  const failed = async (record: IndexerRecord, problem: string) => {
    const failures = record.failures + 1;
    const isTurningOff = record.isEnabled && failures >= turnOffAfter;

    await store.update(record.id, {
      session: record.session,
      failures,
      lastProblem: problem,
      lastFailedAt: now().toISOString(),
      ...(isTurningOff
        ? {
            isEnabled: false,
            turnedOffBecause: `Turned off after ${failures.toString()} failures in a row: ${problem}`,
          }
        : {}),
    });
  };

  const tryOut = async (record: IndexerRecord): Promise<IndexerTest> => {
    try {
      return {
        isWorking: true,
        problem: null,
        capabilities: await client.capabilities(record),
        captcha: null,
      };
    } catch (error) {
      return {
        isWorking: false,
        problem: error instanceof IndexerFailure ? error.message : UNASKABLE,
        capabilities: null,
        captcha: error instanceof CaptchaNeeded ? { image: error.image } : null,
      };
    }
  };

  const fromDraft = async (draft: IndexerDraft, kept: IndexerRecord | null) => {
    const read = IndexerDraftSchema.parse(draft);
    const definition = read.kind === 'cardigann' ? await definitionOf(read) : null;

    if (read.kind === 'cardigann' && definition === null) {
      return {
        problem: `There is no definition named ${read.definitionId ?? 'nothing'} in the catalogue`,
      };
    }

    return { read, secrets: secretsOf(definition), captcha: read.settings[CAPTCHA], kept };
  };

  return {
    list: async (): Promise<Indexer[]> =>
      Promise.all(
        (await store.list())
          .toSorted(
            (left, right) => left.priority - right.priority || left.name.localeCompare(right.name),
          )
          .map(shown),
      ),

    add: async (draft: IndexerDraft): Promise<Indexer | string> => {
      const prepared = await fromDraft(draft, null);

      if ('problem' in prepared) {
        return prepared.problem;
      }

      const { read, secrets } = prepared;
      const at = now().toISOString();

      return shown(
        await store.insert({
          ...read,
          definitionId: read.kind === 'cardigann' ? read.definitionId : null,
          settings: mergeSettings({}, read.settings, secrets),
          session: null,
          id: randomUUID(),
          capabilities: null,
          failures: 0,
          lastProblem: null,
          lastFailedAt: null,
          turnedOffBecause: null,
          createdAt: at,
          updatedAt: at,
        }),
      );
    },

    change: async (id: string, change: IndexerChange): Promise<Indexer | null> => {
      const current = await store.find(id);

      if (current === null) {
        return null;
      }

      const { settings: given, ...rest } = change;
      const isSwitchedOn = change.isEnabled === true && !current.isEnabled;
      const isMoved = change.url !== undefined && change.url !== current.url;
      const isReconfigured = given !== undefined;
      const secrets = secretsOf(await definitionOf(current));
      const updated = await store.update(id, {
        ...Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined)),
        ...(given === undefined
          ? {}
          : { settings: mergeSettings(current.settings, given, secrets) }),
        ...(isSwitchedOn ? { turnedOffBecause: null, failures: 0, lastProblem: null } : {}),
        ...(isMoved ? { capabilities: null } : {}),
        ...(isMoved || isReconfigured ? { session: null } : {}),
        updatedAt: now().toISOString(),
      });

      return updated === null ? null : shown(updated);
    },

    remove: (id: string): Promise<boolean> => store.remove(id),

    test: async (id: string): Promise<IndexerTest | null> => {
      const record = await store.find(id);

      if (record === null) {
        return null;
      }

      const outcome = await tryOut(record);

      if (outcome.isWorking) {
        await succeeded(record, { capabilities: outcome.capabilities });
      } else if (outcome.captcha === null) {
        await failed(record, outcome.problem ?? UNASKABLE);
      } else {
        await store.update(record.id, { session: record.session });
      }

      return outcome;
    },

    tryDraft: async (draft: IndexerDraft, id?: string): Promise<IndexerTest> => {
      const kept = id === undefined ? null : await store.find(id);
      const prepared = await fromDraft(draft, kept);

      if ('problem' in prepared) {
        return { isWorking: false, problem: prepared.problem, capabilities: null, captcha: null };
      }

      const { read, secrets, captcha } = prepared;
      const key = `${id ?? 'new'}:${read.definitionId ?? read.kind}:${read.url}`;
      const session = draftSessions.get(key) ?? { cookies: {}, userAgent: null };
      const record: IndexerRecord = {
        ...read,
        apiKey: read.apiKey === '' ? (kept?.apiKey ?? '') : read.apiKey,
        definitionId: read.kind === 'cardigann' ? read.definitionId : null,
        settings: {
          ...mergeSettings(kept?.settings ?? {}, read.settings, secrets),
          ...(captcha === undefined ? {} : { [CAPTCHA]: captcha }),
        },
        session,
        id: kept?.id ?? randomUUID(),
        capabilities: null,
        failures: 0,
        lastProblem: null,
        lastFailedAt: null,
        turnedOffBecause: null,
        createdAt: now().toISOString(),
        updatedAt: now().toISOString(),
      };
      const outcome = await tryOut(record);

      draftSessions.delete(key);
      draftSessions.set(key, record.session ?? session);

      for (const stale of [...draftSessions.keys()].slice(
        0,
        Math.max(draftSessions.size - MOST_DRAFT_SESSIONS, 0),
      )) {
        draftSessions.delete(stale);
      }

      return outcome;
    },

    search: async (asked: ReleaseSearch): Promise<ReleaseSearchOutcome> => {
      const search = ReleaseSearchSchema.parse(asked);
      const asking = (await store.list())
        .filter(
          (record) =>
            record.isEnabled &&
            (search.indexerIds === undefined || search.indexerIds.includes(record.id)),
        )
        .toSorted((left, right) => left.priority - right.priority);

      const answers = await Promise.all(
        asking.map(async (record) => {
          const started = Date.now();

          try {
            const releases = await client.search(record, search);

            await succeeded(record);

            return {
              releases,
              report: {
                indexerId: record.id,
                indexerName: record.name,
                found: releases.length,
                tookMs: Date.now() - started,
                problem: null,
              },
            };
          } catch (error) {
            const problem = error instanceof IndexerFailure ? error.message : UNASKABLE;

            await failed(record, problem);

            return {
              releases: [],
              report: {
                indexerId: record.id,
                indexerName: record.name,
                found: 0,
                tookMs: Date.now() - started,
                problem,
              },
            };
          }
        }),
      );

      return {
        releases: answers.flatMap((answer) => answer.releases),
        indexers: answers.map((answer) => answer.report),
      };
    },

    download: async (id: string, url: string): Promise<ReleaseFile | null> => {
      const record = await store.find(id);

      if (record === null) {
        return null;
      }

      try {
        return await client.download(record, url);
      } finally {
        await store.update(record.id, { session: record.session });
      }
    },

    health: async (): Promise<IndexerHealth> => {
      const records = await store.list();

      return {
        total: records.length,
        enabled: records.filter((record) => record.isEnabled).length,
        failing: records.flatMap((record) =>
          record.turnedOffBecause !== null
            ? [{ id: record.id, name: record.name, problem: record.turnedOffBecause }]
            : record.isEnabled && record.failures >= failingAfter
              ? [{ id: record.id, name: record.name, problem: record.lastProblem ?? 'Failing' }]
              : [],
        ),
      };
    },
  };
};

type IndexerService = ReturnType<typeof createIndexerService>;

export type { IndexerService };

export { createIndexerService };
