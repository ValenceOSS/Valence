import { describe, expect, it, vi } from 'vitest';
import { aDefinitionYaml } from './aDefinitionYaml';
import { createDefinitionCatalogue } from './createDefinitionCatalogue';
import { createMemoryDefinitionStore } from './createMemoryDefinitionStore';

const SOURCE = { repository: 'Prowlarr/Indexers', branch: 'master', path: 'definitions/v11' };

const LISTING_URL =
  'https://api.github.com/repos/Prowlarr/Indexers/contents/definitions/v11?ref=master';

const RAW = 'https://raw.githubusercontent.com/Prowlarr/Indexers/master/definitions/v11/';

/**
 * A repository holding the files given, recording what it was asked.
 */
const aRepository = (files: Record<string, { sha: string; yaml: string }>, listingStatus = 200) => {
  const asked: string[] = [];
  const fetch = vi.fn((url: string) => {
    asked.push(url);

    if (url === LISTING_URL) {
      return Promise.resolve(
        new Response(
          JSON.stringify([
            ...Object.entries(files).map(([name, file]) => ({ name, sha: file.sha, type: 'file' })),
            { name: 'schema.json', sha: 's', type: 'file' },
            { name: 'old', sha: 'd', type: 'dir' },
          ]),
          { status: listingStatus },
        ),
      );
    }

    const file = files[url.replace(RAW, '')];

    return Promise.resolve(
      new Response(file?.yaml ?? '', { status: file === undefined ? 404 : 200 }),
    );
  });

  return { fetch, asked };
};

const NOW = new Date('2026-09-19T12:00:00.000Z');

describe('createDefinitionCatalogue', () => {
  it('fetches every definition the first time, leaving out what it cannot read', async () => {
    const { fetch } = aRepository({
      'alpha.yml': { sha: 'a1', yaml: aDefinitionYaml('alpha') },
      'beta.yml': { sha: 'b1', yaml: aDefinitionYaml('beta') },
      'broken.yml': { sha: 'x1', yaml: 'id: [' },
    });
    const catalogue = createDefinitionCatalogue({
      store: createMemoryDefinitionStore(),
      source: SOURCE,
      fetch,
      now: () => NOW,
    });

    const read = await catalogue.refresh();

    expect(read).toMatchObject({
      updatedAt: NOW.toISOString(),
      problem: null,
      source: 'Prowlarr/Indexers@master/definitions/v11',
    });
    expect(read.definitions.map((definition) => definition.id)).toEqual(['alpha', 'beta']);
  });

  it('fetches only what changed, and forgets what the repository dropped', async () => {
    const store = createMemoryDefinitionStore();
    const first = aRepository({
      'alpha.yml': { sha: 'a1', yaml: aDefinitionYaml('alpha') },
      'beta.yml': { sha: 'b1', yaml: aDefinitionYaml('beta') },
    });

    await createDefinitionCatalogue({ store, source: SOURCE, fetch: first.fetch }).refresh();

    const second = aRepository({
      'alpha.yml': { sha: 'a2', yaml: aDefinitionYaml('alpha').replace('ALPHA', 'Alpha Two') },
      'gamma.yml': { sha: 'g1', yaml: aDefinitionYaml('gamma') },
    });
    const read = await createDefinitionCatalogue({
      store,
      source: SOURCE,
      fetch: second.fetch,
    }).refresh();

    expect(second.asked).toEqual([LISTING_URL, `${RAW}alpha.yml`, `${RAW}gamma.yml`]);
    expect(read.definitions.map((definition) => definition.name)).toEqual(['Alpha Two', 'GAMMA']);
  });

  it('keeps what it had, and says why, when the repository cannot be read', async () => {
    const store = createMemoryDefinitionStore();

    await createDefinitionCatalogue({
      store,
      source: SOURCE,
      fetch: aRepository({ 'alpha.yml': { sha: 'a1', yaml: aDefinitionYaml('alpha') } }).fetch,
      now: () => NOW,
    }).refresh();

    const read = await createDefinitionCatalogue({
      store,
      source: SOURCE,
      fetch: aRepository({}, 403).fetch,
    }).refresh();

    expect(read.definitions).toHaveLength(1);
    expect(read.updatedAt).toBe(NOW.toISOString());
    expect(read.problem).toBe(
      'The definitions could not be fetched from Prowlarr/Indexers@master/definitions/v11: Prowlarr/Indexers@master/definitions/v11 answered 403',
    );

    const offline = await createDefinitionCatalogue({
      store,
      source: SOURCE,
      fetch: () => Promise.reject(new TypeError('offline')),
    }).refresh();

    expect(offline.problem).toContain('offline');
  });

  it('reads a definition, keeping it parsed until it changes', async () => {
    const store = createMemoryDefinitionStore();
    const catalogue = createDefinitionCatalogue({
      store,
      source: SOURCE,
      fetch: aRepository({ 'alpha.yml': { sha: 'a1', yaml: aDefinitionYaml('alpha') } }).fetch,
    });

    await catalogue.refresh();

    const first = await catalogue.definition('alpha');

    expect(await catalogue.definition('alpha')).toBe(first);
    expect(first?.name).toBe('ALPHA');
    expect(await catalogue.definition('missing')).toBeNull();

    const kept = await store.get('alpha');

    if (kept !== null) {
      await store.save([{ ...kept, sha: 'a2', yaml: 'not: a definition' }]);
    }

    expect(await catalogue.definition('alpha')).toBeNull();
  });

  it('describes one definition for the add-indexer form', async () => {
    const catalogue = createDefinitionCatalogue({
      store: createMemoryDefinitionStore(),
      source: SOURCE,
      fetch: aRepository({ 'alpha.yml': { sha: 'a1', yaml: aDefinitionYaml('alpha') } }).fetch,
    });

    await catalogue.refresh();

    expect((await catalogue.detail('alpha'))?.links).toEqual([
      'https://alpha.example/',
      'https://mirror.alpha.example/',
    ]);
    expect(await catalogue.detail('missing')).toBeNull();
  });

  it('says it is stale before its first refresh, and once it is older than asked', async () => {
    let clock = NOW;
    const catalogue = createDefinitionCatalogue({
      store: createMemoryDefinitionStore(),
      source: SOURCE,
      fetch: aRepository({}).fetch,
      now: () => clock,
    });

    expect(await catalogue.isStale(1000)).toBe(true);

    await catalogue.refresh();

    expect(await catalogue.isStale(1000)).toBe(false);

    clock = new Date(NOW.getTime() + 2000);

    expect(await catalogue.isStale(1000)).toBe(true);
  });
});
