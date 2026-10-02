import { saying } from '@ValenceI18n/saying';
import type { ArrImportIndexer, ArrImportSecret } from '@ValenceContracts/schemas/ArrImport';
import type { Indexer, IndexerDraft } from '@ValenceContracts/schemas/Indexer';
import type { ArrSetup } from '@ValenceRequests/arrImport/ArrSetup';
import { fieldsOf } from '@ValenceRequests/arrImport/fieldsOf';
import { isMasked } from '@ValenceRequests/arrImport/isMasked';
import { sameAddress } from '@ValenceRequests/arrImport/sameAddress';
import type { ArrProvider } from '@ValenceRequests/arrImport/schemas/ArrProviderSchema';

type PlannedIndexer = {
  report: ArrImportIndexer;
  draft: IndexerDraft | null;
  existing: Indexer | null;
  secret: ArrImportSecret | null;
};

const KINDS: Readonly<Record<string, 'torznab' | 'newznab'>> = {
  Torznab: 'torznab',
  Newznab: 'newznab',
};

const SECONDS_IN_A_MINUTE = 60;

/**
 * The origin of an address, which indexers sharing one key share, or the address itself where it
 * cannot be read.
 *
 * @param url - The address.
 * @returns Its origin.
 */
const originOf = (url: string): string => {
  try {
    return new URL(url).origin.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
};

/**
 * The feed Valence asks an indexer an app lists, from its site and the path its API is under.
 *
 * @param provider - The indexer, as the app lists it.
 * @returns The address, or null where it lists no site.
 */
const feedOf = (provider: ArrProvider): string | null => {
  const read = fieldsOf(provider.fields);
  const base = read.text('baseUrl').replace(/\/+$/, '');
  const path = read.text('apiPath') || '/api';

  return base === '' ? null : `${base}/${path.replace(/^\/+/, '')}`;
};

/**
 * The indexers Valence would bring in from the apps' own, for a setup without Prowlarr or beside
 * it: each Torznab and Newznab feed once however many apps list it, with its categories, priority
 * and seeding rules, leaving out the ones Prowlarr put there when Prowlarr is being brought in too,
 * asking once for a key each site shows only masked, and listing any other kind as not brought
 * across.
 *
 * @param arrs - Each app's setup.
 * @param existing - The indexers Valence has already.
 * @param secrets - What the admin typed in for masked keys.
 * @param prowlarrUrl - Where the Prowlarr being brought in answers, if one is.
 * @returns Each indexer, and what bringing it in would do.
 */
const plannedIndexersOf = (
  arrs: readonly ArrSetup[],
  existing: readonly Indexer[],
  secrets: Readonly<Record<string, string>>,
  prowlarrUrl: string | null,
): PlannedIndexer[] => {
  const gathered = new Map<
    string,
    { url: string | null; seen: { setup: ArrSetup; provider: ArrProvider }[] }
  >();

  for (const setup of arrs) {
    for (const provider of setup.indexers) {
      const url = feedOf(provider);

      if (url !== null && prowlarrUrl !== null && originOf(url) === originOf(prowlarrUrl)) {
        continue;
      }

      const key =
        url === null || KINDS[provider.implementation] === undefined
          ? `${provider.implementation}@${setup.source.url}#${provider.id.toString()}`
          : url.toLowerCase();
      const group = gathered.get(key) ?? { url, seen: [] };

      group.seen.push({ setup, provider });
      gathered.set(key, group);
    }
  }

  return [...gathered.entries()].map(([key, { url, seen }]): PlannedIndexer => {
    const [first] = seen;
    const implementation = first?.provider.implementation ?? '';
    const kind = KINDS[implementation] ?? null;
    const name = (first?.provider.name.trim() || implementation || key).slice(0, 80);
    const from = [...new Set(seen.map(({ setup }) => setup.source.name))];

    if (kind === null || url === null || first === undefined) {
      return {
        report: {
          key,
          name,
          kind,
          url,
          from,
          standing: 'unsupported',
          notes: [
            saying('requests.arrImport.valenceCannotUseIndexerYet', { indexer: implementation }),
          ],
        },
        draft: null,
        existing: null,
        secret: null,
      };
    }

    const read = fieldsOf(first.provider.fields);
    const keys = seen
      .map(({ provider }) => fieldsOf(provider.fields).text('apiKey'))
      .filter((value) => value !== '');
    const plain = keys.find((value) => !isMasked(value));
    const secretKey = `indexer:${originOf(url)}`;
    const secret =
      plain === undefined && keys.length > 0
        ? { key: secretKey, field: 'apiKey' as const, item: name, from }
        : null;
    const categories = [
      ...new Set(
        seen.flatMap(({ provider }) => [
          ...fieldsOf(provider.fields).numbers('categories'),
          ...fieldsOf(provider.fields).numbers('animeCategories'),
        ]),
      ),
    ].toSorted((left, right) => left - right);
    const seedRatio = read.number('seedCriteria.seedRatio');
    const seedMinutes = read.number('seedCriteria.seedTime');
    const kept = existing.find((indexer) => sameAddress(indexer.url, url));

    return {
      report: {
        key,
        name,
        kind,
        url,
        from,
        standing: kept === undefined ? 'new' : 'kept',
        notes: [],
      },
      draft: {
        name,
        kind,
        url,
        apiKey: (plain ?? secrets[secretKey] ?? '').slice(0, 200),
        priority: Math.min(
          50,
          Math.max(1, Math.min(...seen.map(({ provider }) => provider.priority))),
        ),
        isEnabled: seen.some(({ provider }) => provider.enable),
        categories,
        seedRatio: seedRatio === null ? null : Math.min(1000, seedRatio),
        seedSeconds:
          seedMinutes === null
            ? null
            : Math.min(31_536_000, Math.round(seedMinutes * SECONDS_IN_A_MINUTE)),
      },
      existing: kept ?? null,
      secret,
    };
  });
};

export type { PlannedIndexer };

export { plannedIndexersOf };
