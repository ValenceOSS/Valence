import { describe, expect, it, vi } from 'vitest';
import { IndexerFailure } from './IndexerFailure';
import { CaptchaNeeded } from './CaptchaNeeded';
import { readDefinition } from '@ValenceRequests/cardigann/readDefinition';
import { QualityProfileDraftSchema } from '@ValenceContracts/schemas/QualityProfile';
import { createIndexerService } from './createIndexerService';
import { createMemoryRecordStore } from '@ValenceRequests/stores/createMemoryRecordStore';
import type { IndexerClient, IndexerConnection } from './createIndexerClient';
import type { IndexerRecord } from './IndexerRecord';
import type { IndexerCapabilities, Release } from '@ValenceContracts/schemas/Indexer';

const NOW = new Date('2026-09-19T12:00:00.000Z');

const CAPS: IndexerCapabilities = {
  categories: [{ id: 2000, name: 'Movies', subcategories: [] }],
  modes: [{ mode: 'search', parameters: ['q'] }],
  limit: 100,
};

/**
 * An indexer as kept, with anything the test cares about changed.
 */
const anIndexer = (overrides: Partial<IndexerRecord> = {}): IndexerRecord => ({
  id: '0f8fad5b-d9cb-469f-a165-70867728950e',
  name: 'Jackett',
  kind: 'torznab',
  url: 'http://jackett:9117/',
  apiKey: 'a-key',
  definitionId: null,
  settings: {},
  session: null,
  priority: 25,
  isEnabled: true,
  categories: [],
  requestsPerMinute: null,
  timeoutSeconds: 30,
  removesWhenDone: null,
  seedSeconds: null,
  seedRatio: null,
  capabilities: null,
  failures: 0,
  lastProblem: null,
  lastProblemCode: null,
  lastFailedAt: null,
  turnedOffBecause: null,
  createdAt: '2026-09-18T00:00:00.000Z',
  updatedAt: '2026-09-18T00:00:00.000Z',
  ...overrides,
});

const SECOND = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

/**
 * A release one indexer found.
 */
const aRelease = (indexer: IndexerConnection, title: string): Release => ({
  id: `${indexer.id}-${title}`,
  title,
  indexerId: indexer.id,
  indexerName: indexer.name,
  protocol: 'torrent',
  sizeBytes: null,
  seeders: null,
  leechers: null,
  grabs: null,
  publishedAt: null,
  categories: [],
  downloadUrl: null,
  magnetUrl: null,
  infoUrl: null,
  infoHash: null,
  downloadFactor: null,
  uploadFactor: null,
  minimumRatio: null,
  minimumSeedSeconds: null,
});

/**
 * A client that answers as told, or fails with the reason given.
 */
const aClient = (
  answers: {
    capabilities?: IndexerCapabilities | Error;
    search?: (indexer: IndexerConnection) => Release[];
    download?: Error;
  } = {},
): IndexerClient => ({
  capabilities: vi.fn(() =>
    answers.capabilities instanceof Error
      ? Promise.reject(answers.capabilities)
      : Promise.resolve(answers.capabilities ?? CAPS),
  ),
  search: vi.fn((indexer: IndexerConnection) => {
    try {
      return Promise.resolve(answers.search?.(indexer) ?? []);
    } catch (error) {
      return Promise.reject(error instanceof Error ? error : new Error('no'));
    }
  }),
  download: vi.fn((indexer: IndexerConnection, url: string) => {
    if (answers.download instanceof Error) {
      return Promise.reject(answers.download);
    }

    indexer.session = { cookies: { sid: 'after' }, userAgent: null };

    return Promise.resolve({ kind: 'magnet' as const, url });
  }),
});

/**
 * The service over a store holding the indexers given.
 */
const aService = (records: IndexerRecord[] = [], client = aClient()) => {
  const store = createMemoryRecordStore<IndexerRecord>(records);

  return { service: createIndexerService({ store, client, now: () => NOW }), store, client };
};

describe('createIndexerService', () => {
  it('lists indexers by priority, then name, without their keys', async () => {
    const { service } = aService([
      anIndexer({ name: 'Zeta' }),
      anIndexer({ id: SECOND, name: 'Alpha' }),
      anIndexer({
        id: '9b2e1f5a-8d4c-4e2a-9f6b-1c3d5e7f9a0b',
        name: 'First',
        priority: 1,
        apiKey: '',
      }),
    ]);

    const listed = await service.list();

    expect(listed.map((one) => one.name)).toEqual(['First', 'Alpha', 'Zeta']);
    expect(listed.map((one) => one.hasApiKey)).toEqual([false, true, true]);
    expect(Object.keys(listed[0] ?? {})).not.toContain('apiKey');
  });

  it('adds an indexer, filling in what was not decided', async () => {
    const { service, store } = aService();

    const added = await service.add({
      name: 'NZBgeek',
      kind: 'newznab',
      url: 'https://api.nzbgeek.info',
      apiKey: 'secret',
    });

    expect(added).toMatchObject({
      name: 'NZBgeek',
      priority: 25,
      hasApiKey: true,
      createdAt: NOW.toISOString(),
    });
    expect((await store.find(typeof added === 'string' ? '' : added.id))?.apiKey).toBe('secret');
  });

  it('changes only what it is told, and keeps the key when none is given', async () => {
    const { service, store } = aService([anIndexer()]);

    expect(await service.change(anIndexer().id, { priority: 5 })).toMatchObject({ priority: 5 });
    expect((await store.find(anIndexer().id))?.apiKey).toBe('a-key');
  });

  it('forgets what an indexer can do when it is moved somewhere else', async () => {
    const { service } = aService([anIndexer({ capabilities: CAPS })]);

    expect(
      (await service.change(anIndexer().id, { url: 'http://prowlarr:9696/1/' }))?.capabilities,
    ).toBeNull();
    expect((await service.change(anIndexer().id, { name: 'Same place' }))?.capabilities).toBeNull();
  });

  it('keeps what an indexer can do when it stays where it is', async () => {
    const { service } = aService([anIndexer({ capabilities: CAPS })]);

    expect((await service.change(anIndexer().id, { url: anIndexer().url }))?.capabilities).toEqual(
      CAPS,
    );
  });

  it('clears why an indexer was turned off when somebody switches it back on', async () => {
    const { service } = aService([
      anIndexer({ isEnabled: false, failures: 5, turnedOffBecause: 'Turned off after 5 failures' }),
    ]);

    expect(await service.change(anIndexer().id, { isEnabled: true })).toMatchObject({
      isEnabled: true,
      failures: 0,
      turnedOffBecause: null,
    });
  });

  it('changes and tests nothing that is not there', async () => {
    const { service } = aService();

    expect(await service.change(anIndexer().id, { priority: 1 })).toBeNull();
    expect(await service.test(anIndexer().id)).toBeNull();
    expect(await service.remove(anIndexer().id)).toBe(false);
  });

  it('tests an indexer, keeping what it can do and clearing its failures', async () => {
    const { service, store } = aService([anIndexer({ failures: 2, lastProblem: 'Timed out' })]);

    expect(await service.test(anIndexer().id)).toEqual({
      isWorking: true,
      problem: null,
      problemCode: null,
      capabilities: CAPS,
      captcha: null,
    });
    expect(await store.find(anIndexer().id)).toMatchObject({
      capabilities: CAPS,
      failures: 0,
      lastProblem: null,
      lastProblemCode: null,
    });
  });

  it('switches an indexer back on when it answers a test after failures turned it off', async () => {
    const { service, store } = aService([
      anIndexer({
        isEnabled: false,
        failures: 5,
        turnedOffBecause: 'Turned off after 5 failures in a row: The site could not be reached',
      }),
    ]);

    await service.test(anIndexer().id);

    expect(await store.find(anIndexer().id)).toMatchObject({
      isEnabled: true,
      turnedOffBecause: null,
      failures: 0,
    });
  });

  it('leaves an indexer somebody switched off switched off, even when it answers a test', async () => {
    const { service, store } = aService([anIndexer({ isEnabled: false, turnedOffBecause: null })]);

    await service.test(anIndexer().id);

    expect(await store.find(anIndexer().id)).toMatchObject({ isEnabled: false });
  });

  it('counts a failed test against an indexer, saying why', async () => {
    const { service, store } = aService(
      [anIndexer()],
      aClient({ capabilities: new IndexerFailure('The indexer refused the API key') }),
    );

    expect(await service.test(anIndexer().id)).toEqual({
      isWorking: false,
      problem: 'The indexer refused the API key',
      problemCode: null,
      capabilities: null,
      captcha: null,
    });
    expect(await store.find(anIndexer().id)).toMatchObject({
      failures: 1,
      lastProblem: 'The indexer refused the API key',
      lastProblemCode: null,
      lastFailedAt: NOW.toISOString(),
    });
  });

  it('keeps what kind of failure it was, from the test and from a search', async () => {
    const blocked = new IndexerFailure(
      'The site’s Cloudflare refuses this address outright',
      'CloudflareRefusesAddress',
    );
    const { service, store } = aService(
      [anIndexer()],
      aClient({
        capabilities: blocked,
        search: () => {
          throw blocked;
        },
      }),
    );

    expect((await service.test(anIndexer().id))?.problemCode).toBe('CloudflareRefusesAddress');
    expect(await store.find(anIndexer().id)).toMatchObject({
      lastProblemCode: 'CloudflareRefusesAddress',
    });

    const outcome = await service.search({ query: 'Dune', mode: 'search' }, null);

    expect(outcome.indexers[0]?.problemCode).toBe('CloudflareRefusesAddress');
  });

  it('says something even for a failure it did not expect', async () => {
    const { service } = aService([anIndexer()], aClient({ capabilities: new Error('boom') }));

    expect((await service.test(anIndexer().id))?.problem).toBe('The indexer could not be asked');
  });

  it('tries an indexer before it is kept, keeping nothing', async () => {
    const { service, store, client } = aService();

    expect(
      await service.tryDraft({
        name: 'New',
        kind: 'torznab',
        url: 'http://jackett:9117/',
        apiKey: 'k',
      }),
    ).toMatchObject({ isWorking: true });
    expect(await store.list()).toEqual([]);
    expect(client.capabilities).toHaveBeenCalledWith(expect.objectContaining({ apiKey: 'k' }));
  });

  it('tries a change to a kept indexer with the key it already has', async () => {
    const { service, client } = aService([anIndexer()]);

    await service.tryDraft(
      { name: 'Jackett', kind: 'torznab', url: 'http://elsewhere:9117/' },
      anIndexer().id,
    );

    expect(client.capabilities).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'a-key', url: 'http://elsewhere:9117/' }),
    );
  });

  it('tries a draft with no key for an indexer that is not kept', async () => {
    const { service, client } = aService();

    await service.tryDraft({ name: 'New', kind: 'torznab', url: 'http://x:1/' }, SECOND);

    expect(client.capabilities).toHaveBeenCalledWith(expect.objectContaining({ apiKey: '' }));
  });

  it('searches every indexer that is on at once, and says what each found', async () => {
    const first = anIndexer({ priority: 10 });
    const second = anIndexer({ id: SECOND, name: 'NZBgeek', priority: 5 });
    const off = anIndexer({
      id: '9b2e1f5a-8d4c-4e2a-9f6b-1c3d5e7f9a0b',
      name: 'Off',
      isEnabled: false,
    });
    const { service, client } = aService(
      [first, second, off],
      aClient({ search: (indexer) => [aRelease(indexer, 'Dune')] }),
    );

    const outcome = await service.search({ query: 'dune' });

    expect(outcome.releases.map((release) => release.indexerName)).toEqual(['NZBgeek', 'Jackett']);
    expect(outcome.indexers).toEqual([
      expect.objectContaining({
        indexerName: 'NZBgeek',
        found: 1,
        problem: null,
        problemCode: null,
      }),
      expect.objectContaining({
        indexerName: 'Jackett',
        found: 1,
        problem: null,
        problemCode: null,
      }),
    ]);
    expect(client.search).toHaveBeenCalledTimes(2);
  });

  it('judges what it found against a profile, and puts it in the order it would be chosen', async () => {
    const { service } = aService(
      [anIndexer()],
      aClient({
        search: (indexer) => [
          { ...aRelease(indexer, 'Dune.2021.720p.WEB-DL.x264-GRP'), id: 'small', seeders: 50 },
          { ...aRelease(indexer, 'Dune.2021.1080p.BluRay.x264-GRP'), id: 'best', seeders: 5 },
          { ...aRelease(indexer, 'Dune.2021.2160p.BluRay.x265-GRP'), id: 'refused' },
        ],
      }),
    );
    const profile = {
      ...QualityProfileDraftSchema.parse({ name: 'HD', kind: 'video' }),
      id: SECOND,
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    };

    const outcome = await service.search({ query: 'dune', runtimeMinutes: 155 }, profile);

    expect(outcome.releases.map((release) => release.id)).toEqual(['best', 'small', 'refused']);
    expect(outcome.pickedId).toBe('best');
    expect(outcome.judgements.map((judgement) => judgement.isRejected)).toEqual([
      false,
      false,
      true,
    ]);
    expect(outcome.judgements[0]?.parsed.resolution).toBe('1080p');
  });

  it('judges nothing without a profile', async () => {
    const { service } = aService([anIndexer()]);

    expect(await service.search({ query: 'dune' })).toMatchObject({
      judgements: [],
      pickedId: null,
    });
  });

  it('searches only the indexers asked for', async () => {
    const { service, client } = aService([anIndexer(), anIndexer({ id: SECOND, name: 'NZBgeek' })]);

    await service.search({ query: 'dune', indexerIds: [SECOND] });

    expect(client.search).toHaveBeenCalledTimes(1);
    expect(client.search).toHaveBeenCalledWith(
      expect.objectContaining({ id: SECOND }),
      expect.anything(),
    );
  });

  it('goes on without an indexer that failed, saying why, and counting it', async () => {
    const { service, store } = aService(
      [anIndexer(), anIndexer({ id: SECOND, name: 'NZBgeek' })],
      aClient({
        search: (indexer) => {
          if (indexer.id === SECOND) {
            throw new IndexerFailure('The indexer did not answer within 30 seconds');
          }

          return [aRelease(indexer, 'Dune')];
        },
      }),
    );

    const outcome = await service.search({ query: 'dune' });

    expect(outcome.releases).toHaveLength(1);
    expect(outcome.indexers.find((one) => one.indexerId === SECOND)?.problem).toBe(
      'The indexer did not answer within 30 seconds',
    );
    expect((await store.find(SECOND))?.failures).toBe(1);
  });

  it('says something for a search failure it did not expect', async () => {
    const { service } = aService(
      [anIndexer()],
      aClient({
        search: () => {
          throw new Error('boom');
        },
      }),
    );

    expect((await service.search({ query: 'x' })).indexers[0]?.problem).toBe(
      'The indexer could not be asked',
    );
  });

  it('turns an indexer off after too many failures in a row, saying why', async () => {
    const { service, store } = aService(
      [anIndexer({ failures: 4 })],
      aClient({ capabilities: new IndexerFailure('The indexer could not be reached') }),
    );

    await service.test(anIndexer().id);

    expect(await store.find(anIndexer().id)).toMatchObject({
      isEnabled: false,
      failures: 5,
      turnedOffBecause: 'Turned off after 5 failures in a row: The indexer could not be reached',
    });
  });

  it('clears the count when an indexer answers a search', async () => {
    const { service, store } = aService([anIndexer({ failures: 2 })]);

    await service.search({ query: 'x' });

    expect((await store.find(anIndexer().id))?.failures).toBe(0);
  });

  it('says how many indexers there are, and which are failing', async () => {
    const { service } = aService([
      anIndexer(),
      anIndexer({
        id: SECOND,
        name: 'Flaky',
        failures: 3,
        lastProblem: 'Timed out',
        lastProblemCode: 'CloudflareCheckFailed',
      }),
      anIndexer({
        id: '9b2e1f5a-8d4c-4e2a-9f6b-1c3d5e7f9a0b',
        name: 'Off',
        isEnabled: false,
        failures: 5,
        turnedOffBecause: 'Turned off after 5 failures',
      }),
      anIndexer({ id: '1b4e28ba-2fa1-41d2-883f-0016d3cca427', name: 'Quiet', failures: 3 }),
    ]);

    expect(await service.health()).toEqual({
      total: 4,
      enabled: 3,
      failing: [
        { id: SECOND, name: 'Flaky', problem: 'Timed out', problemCode: 'CloudflareCheckFailed' },
        {
          id: '9b2e1f5a-8d4c-4e2a-9f6b-1c3d5e7f9a0b',
          name: 'Off',
          problem: 'Turned off after 5 failures',
          problemCode: 'IndexerFailing',
        },
        {
          id: '1b4e28ba-2fa1-41d2-883f-0016d3cca427',
          name: 'Quiet',
          problem: 'Failing',
          problemCode: 'IndexerFailing',
        },
      ],
    });
  });

  describe('indexers made from definitions', () => {
    const DEFINITION = readDefinition(`id: alpha
name: Alpha
type: semi-private
links: [https://alpha.example/]
settings:
  - {name: username, type: text, label: Username}
  - {name: password, type: password, label: Password}
  - {name: freeleech, type: checkbox, label: Free only}
caps:
  modes:
    search: [q]
search:
  rows:
    selector: tr
  fields:
    title:
      selector: a
`);

    const definitions = (id: string) => Promise.resolve(id === 'alpha' ? DEFINITION : null);

    const A_DRAFT = {
      name: 'Alpha',
      kind: 'cardigann' as const,
      url: 'https://alpha.example/',
      definitionId: 'alpha',
      settings: { username: 'ada', password: 'hunter2', freeleech: true, CAPTCHA: 'x1y2' },
    };

    /**
     * The service with definitions to find.
     */
    const withDefinitions = (records: IndexerRecord[] = [], client = aClient()) => {
      const store = createMemoryRecordStore<IndexerRecord>(records);

      return {
        service: createIndexerService({ store, client, definitions, now: () => NOW }),
        store,
        client,
      };
    };

    const kept = (overrides: Partial<IndexerRecord> = {}) =>
      anIndexer({
        kind: 'cardigann',
        definitionId: 'alpha',
        apiKey: '',
        settings: { username: 'ada', password: 'hunter2', freeleech: true },
        session: { cookies: { sid: 'kept' }, userAgent: null },
        ...overrides,
      });

    it('refuses to add an indexer whose definition is not in the catalogue', async () => {
      const { service } = withDefinitions();

      expect(await service.add({ ...A_DRAFT, definitionId: 'nope' })).toBe(
        'There is no definition named nope in the catalogue',
      );
      expect(await service.add({ ...A_DRAFT, definitionId: null })).toBe(
        'There is no definition named nothing in the catalogue',
      );
    });

    it('adds one, showing its settings but never its secrets, and never keeping a captcha answer', async () => {
      const { service, store } = withDefinitions();
      const added = await service.add(A_DRAFT);

      expect(added).toMatchObject({
        kind: 'cardigann',
        definitionId: 'alpha',
        settings: { username: 'ada', freeleech: true },
        secretsSet: ['password'],
        privacy: 'semi-private',
      });
      expect(JSON.stringify(added)).not.toContain('hunter2');
      expect((await store.list())[0]?.settings).toEqual({
        username: 'ada',
        password: 'hunter2',
        freeleech: true,
      });
    });

    it('shows an indexer whose definition has gone as having no privacy', async () => {
      const { service } = withDefinitions([
        kept({ definitionId: 'gone' }),
        anIndexer({ id: SECOND, name: 'Torznab' }),
      ]);

      expect((await service.list()).map((one) => one.privacy)).toEqual([null, null]);
    });

    it('keeps a secret left blank, replaces one given, and forgets the session', async () => {
      const { service, store } = withDefinitions([kept()]);

      await service.change(kept().id, { settings: { username: 'grace', password: '' } });

      expect(await store.find(kept().id)).toMatchObject({
        settings: { username: 'grace', password: 'hunter2', freeleech: true },
        session: null,
      });

      await service.change(kept().id, { settings: { password: 'new-one', CAPTCHA: 'z' } });

      expect((await store.find(kept().id))?.settings).toEqual({
        username: 'grace',
        password: 'new-one',
        freeleech: true,
      });
    });

    it('keeps no secret that was never given', async () => {
      const { service, store } = withDefinitions();

      await service.add({ ...A_DRAFT, settings: { username: 'ada', password: '' } });

      expect((await store.list())[0]?.settings).toEqual({ username: 'ada' });
    });

    it('forgets the session when the address moves, and keeps it for anything else', async () => {
      const { service, store } = withDefinitions([kept()]);

      await service.change(kept().id, { priority: 3 });

      expect((await store.find(kept().id))?.session).toEqual({
        cookies: { sid: 'kept' },
        userAgent: null,
      });

      await service.change(kept().id, { url: 'https://mirror.alpha.example/' });

      expect((await store.find(kept().id))?.session).toBeNull();
    });

    it('shows the captcha a test meets, without counting it as a failure', async () => {
      const { service, store } = withDefinitions(
        [kept()],
        aClient({ capabilities: new CaptchaNeeded('data:image/png;base64,AQID') }),
      );

      expect(await service.test(kept().id)).toEqual({
        isWorking: false,
        problem: 'Type the characters in the picture to log in',
        problemCode: null,
        capabilities: null,
        captcha: { image: 'data:image/png;base64,AQID' },
      });
      expect((await store.find(kept().id))?.failures).toBe(0);
    });

    it('tries a definition before it is kept, with the captcha answer and the kept secrets', async () => {
      const { service, client } = withDefinitions([kept()]);

      await service.tryDraft(
        { ...A_DRAFT, settings: { username: 'ada', password: '', CAPTCHA: 'x1y2' } },
        kept().id,
      );

      expect(client.capabilities).toHaveBeenCalledWith(
        expect.objectContaining({
          settings: { username: 'ada', password: 'hunter2', freeleech: true, CAPTCHA: 'x1y2' },
        }),
      );
    });

    it('says so when a definition to try is not in the catalogue', async () => {
      const { service } = withDefinitions();

      expect(await service.tryDraft({ ...A_DRAFT, definitionId: 'nope' })).toEqual({
        isWorking: false,
        problem: 'There is no definition named nope in the catalogue',
        problemCode: null,
        capabilities: null,
        captcha: null,
      });
    });

    it('carries a draft’s session from one try to the next, so a captcha answer meets the page it came from', async () => {
      const seen: (string | undefined)[] = [];
      const client = aClient();

      client.capabilities = vi.fn((indexer: IndexerConnection) => {
        seen.push(indexer.session?.cookies['sid']);
        indexer.session = { cookies: { sid: `after-${seen.length.toString()}` }, userAgent: null };

        return Promise.resolve(CAPS);
      });

      const { service } = withDefinitions([], client);

      await service.tryDraft(A_DRAFT);
      await service.tryDraft(A_DRAFT);

      expect(seen).toEqual([undefined, 'after-1']);
    });

    it('forgets the oldest draft sessions once there are many', async () => {
      const { service } = withDefinitions();

      for (let at = 0; at < 60; at += 1) {
        await service.tryDraft({ ...A_DRAFT, url: `https://alpha${at.toString()}.example/` });
      }

      expect(await service.tryDraft(A_DRAFT)).toMatchObject({ isWorking: true });
    });

    it('keeps the session a search leaves behind', async () => {
      const client = aClient({
        search: (indexer) => {
          indexer.session = { cookies: { sid: 'fresh' }, userAgent: null };

          return [];
        },
      });
      const { service, store } = withDefinitions([kept()], client);

      await service.search({ query: 'dune' });

      expect((await store.find(kept().id))?.session).toEqual({
        cookies: { sid: 'fresh' },
        userAgent: null,
      });
    });

    it('fetches a release, keeping the session it leaves behind', async () => {
      const { service, store } = withDefinitions([kept()]);

      expect(await service.download(kept().id, 'https://alpha.example/dl/1')).toEqual({
        kind: 'magnet',
        url: 'https://alpha.example/dl/1',
      });
      expect((await store.find(kept().id))?.session).toEqual({
        cookies: { sid: 'after' },
        userAgent: null,
      });
      expect(await service.download('7c9e6679-7425-40de-944b-e07fc1f90ae8', 'x')).toBeNull();
    });

    it('passes on why a release could not be fetched', async () => {
      const { service } = withDefinitions(
        [kept()],
        aClient({ download: new IndexerFailure('Gone') }),
      );

      await expect(service.download(kept().id, 'https://alpha.example/dl/1')).rejects.toThrow(
        'Gone',
      );
    });
  });
});
