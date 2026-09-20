import { z } from 'zod';
import { readDefinition } from '@ValenceRequests/cardigann/readDefinition';
import { describeDefinition } from '@ValenceRequests/definitions/describeDefinition';
import { summariseDefinition } from '@ValenceRequests/definitions/summariseDefinition';
import type { CardigannDefinition } from '@ValenceRequests/cardigann/CardigannDefinitionSchema';
import type {
  IndexerCatalogue,
  IndexerDefinitionDetail,
} from '@ValenceContracts/schemas/IndexerDefinition';
import type {
  DefinitionRecord,
  DefinitionStore,
} from '@ValenceRequests/definitions/DefinitionRecord';

type DefinitionSource = { repository: string; branch: string; path: string };

type CreateDefinitionCatalogueOptions = {
  store: DefinitionStore;
  source: DefinitionSource;
  fetch: (
    url: string,
    init: { headers: Record<string, string>; signal: AbortSignal },
  ) => Promise<Response>;
  now?: () => Date;
  concurrency?: number;
};

const ListingSchema = z.array(z.object({ name: z.string(), sha: z.string(), type: z.string() }));

/**
 * The catalogue of sites Valence can search without an indexer of their own: the Cardigann
 * definitions a public repository keeps, fetched from it and kept here so that they go on working
 * whether or not it can be reached.
 *
 * Refreshing asks the repository for its listing once, then fetches only the definitions whose
 * content changed, and forgets the ones it no longer has. A definition this engine cannot read is
 * left out rather than failing the rest.
 *
 * @param store - Where definitions are kept.
 * @param source - The repository, branch and folder they come from.
 * @param fetch - How to ask.
 * @param now - The clock.
 * @param concurrency - How many definitions to fetch at once.
 * @returns The catalogue.
 */
const createDefinitionCatalogue = ({
  store,
  source,
  fetch,
  now = () => new Date(),
  concurrency = 8,
}: CreateDefinitionCatalogueOptions) => {
  const parsed = new Map<string, { sha: string; definition: CardigannDefinition }>();
  const label = `${source.repository}@${source.branch}/${source.path}`;

  const definition = async (id: string): Promise<CardigannDefinition | null> => {
    const record = await store.get(id);

    if (record === null) {
      return null;
    }

    const cached = parsed.get(id);

    if (cached?.sha === record.sha) {
      return cached.definition;
    }

    const read = readDefinition(record.yaml);

    if (read !== null) {
      parsed.set(id, { sha: record.sha, definition: read });
    }

    return read;
  };

  const refresh = async (): Promise<IndexerCatalogue> => {
    try {
      const listing = await fetch(
        `https://api.github.com/repos/${source.repository}/contents/${source.path}?ref=${encodeURIComponent(source.branch)}`,
        { headers: { accept: 'application/vnd.github+json' }, signal: AbortSignal.timeout(30_000) },
      );

      if (!listing.ok) {
        throw new Error(`${label} answered ${listing.status.toString()}`);
      }

      const files = ListingSchema.parse(await listing.json()).filter(
        (file) => file.type === 'file' && file.name.endsWith('.yml'),
      );
      const kept = new Map(
        (await store.list()).map((summary) => [`${summary.id}.yml`, summary.sha]),
      );
      const changed = files.filter((file) => kept.get(file.name) !== file.sha);
      const fetchedAt = now().toISOString();
      const fetched: DefinitionRecord[] = [];

      for (let at = 0; at < changed.length; at += concurrency) {
        const batch = await Promise.all(
          changed.slice(at, at + concurrency).map(async (file) => {
            const response = await fetch(
              `https://raw.githubusercontent.com/${source.repository}/${source.branch}/${source.path}/${file.name}`,
              { headers: {}, signal: AbortSignal.timeout(30_000) },
            );
            const yaml = response.ok ? await response.text() : '';
            const read = readDefinition(yaml);

            return read === null ? [] : [summariseDefinition(read, yaml, file.sha, fetchedAt)];
          }),
        );

        fetched.push(...batch.flat());
      }

      const listed = new Set(files.map((file) => file.name));

      await store.save(fetched);
      await store.remove(
        [...kept.keys()]
          .filter((name) => !listed.has(name))
          .map((name) => name.replace(/\.yml$/, '')),
      );
      await store.writeState({ updatedAt: fetchedAt, problem: null });
    } catch (error) {
      const { updatedAt } = await store.readState();

      await store.writeState({
        updatedAt,
        problem: `The definitions could not be fetched from ${label}: ${error instanceof Error ? error.message : 'no reason given'}`,
      });
    }

    return catalogue();
  };

  const catalogue = async (): Promise<IndexerCatalogue> => {
    const state = await store.readState();

    return {
      definitions: (await store.list())
        .map(({ id, name, description, language, privacy, protocol, categories }) => ({
          id,
          name,
          description,
          language,
          privacy,
          protocol,
          categories,
        }))
        .toSorted((left, right) => left.name.localeCompare(right.name)),
      updatedAt: state.updatedAt,
      source: label,
      problem: state.problem,
    };
  };

  const detail = async (id: string): Promise<IndexerDefinitionDetail | null> => {
    const read = await definition(id);

    return read === null ? null : describeDefinition(read);
  };

  const isStale = async (maxAgeMs: number): Promise<boolean> => {
    const { updatedAt } = await store.readState();

    return updatedAt === null || now().getTime() - Date.parse(updatedAt) > maxAgeMs;
  };

  return { refresh, catalogue, detail, definition, isStale };
};

type DefinitionCatalogue = ReturnType<typeof createDefinitionCatalogue>;

export type { DefinitionCatalogue, DefinitionSource };

export { createDefinitionCatalogue };
