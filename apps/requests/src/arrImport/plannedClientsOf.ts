import { saying } from '@ValenceI18n/saying';
import type { Said } from '@ValenceI18n/SaidSchema';
import type {
  ArrImportClient,
  ArrImportSecret,
  ArrPathMapping,
} from '@ValenceContracts/schemas/ArrImport';
import {
  DEFAULT_DOWNLOAD_CATEGORIES,
  DownloadCategoriesSchema,
} from '@ValenceContracts/schemas/DownloadClient';
import type {
  DownloadCategories,
  DownloadClientDraft,
  DownloadClientKind,
} from '@ValenceContracts/schemas/DownloadClient';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';
import type { DownloadClientRecord } from '@ValenceRequests/downloads/DownloadClientRecord';
import type { ArrSetup } from '@ValenceRequests/arrImport/ArrSetup';
import { CATEGORY_FIELDS } from '@ValenceRequests/arrImport/CATEGORY_FIELDS';
import { CLIENT_KINDS } from '@ValenceRequests/arrImport/CLIENT_KINDS';
import { clientAddressOf } from '@ValenceRequests/arrImport/clientAddressOf';
import { fieldsOf } from '@ValenceRequests/arrImport/fieldsOf';
import { isMasked } from '@ValenceRequests/arrImport/isMasked';
import { mapArrPath } from '@ValenceRequests/arrImport/mapArrPath';
import { sameAddress } from '@ValenceRequests/arrImport/sameAddress';
import type { ArrProvider } from '@ValenceRequests/arrImport/schemas/ArrProviderSchema';

type PlannedClient = {
  report: ArrImportClient;
  draft: DownloadClientDraft | null;
  existing: DownloadClientRecord | null;
  secrets: ArrImportSecret[];
};

type Seen = { setup: ArrSetup; provider: ArrProvider };

type Gathered = { kind: DownloadClientKind | null; url: string | null; seen: Seen[] };

/**
 * The categories a client files each kind of library's downloads under, from what each app that
 * uses it calls its own, keeping Valence's own for a kind no app names and for any an app names in a
 * way Valence cannot keep, such as two kinds under one category.
 *
 * @param seen - The client, as each app that uses it lists it.
 * @returns The categories, and whether any were left out.
 */
const categoriesOf = (
  seen: readonly Seen[],
): { categories: DownloadCategories; isKept: boolean } => {
  const named: Partial<Record<LibraryKind, string>> = {};

  for (const { setup, provider } of seen) {
    const { libraryKind, field } = CATEGORY_FIELDS[setup.kind];
    const category = fieldsOf(provider.fields).text(field);

    if (category !== '' && named[libraryKind] === undefined) {
      named[libraryKind] = category;
    }
  }

  let categories: DownloadCategories = { ...DEFAULT_DOWNLOAD_CATEGORIES };
  let isKept = true;

  for (const [kind, category] of Object.entries(named)) {
    const tried = DownloadCategoriesSchema.safeParse({ ...categories, [kind]: category });

    if (tried.success) {
      categories = tried.data;
    } else {
      isKept = false;
    }
  }

  return { categories, isKept };
};

/**
 * The download clients Valence would bring in from every app's: one for each client however many
 * apps use it, with its address, login, the categories each app files under, its priority and where
 * it keeps files as Valence sees them; a password or key an app shows only masked is asked for, and
 * a client Valence cannot use is listed as not brought across.
 *
 * @param arrs - Each app's setup.
 * @param existing - The clients Valence has already.
 * @param secrets - What the admin typed in for masked passwords and keys.
 * @param mappings - Where the apps' folders are, as the admin said.
 * @returns Each client, and what bringing it in would do.
 */
const plannedClientsOf = (
  arrs: readonly ArrSetup[],
  existing: readonly DownloadClientRecord[],
  secrets: Readonly<Record<string, string>>,
  mappings: readonly ArrPathMapping[],
): PlannedClient[] => {
  const gathered = new Map<string, Gathered>();

  for (const setup of arrs) {
    for (const provider of setup.clients) {
      const kind = CLIENT_KINDS[provider.implementation] ?? null;
      const url = kind === null ? null : clientAddressOf(kind, provider.fields);
      const key =
        kind === null || url === null
          ? `${provider.implementation}@${setup.source.url}#${provider.id.toString()}`
          : `${kind}@${url.toLowerCase()}`;
      const group = gathered.get(key) ?? { kind, url, seen: [] };

      group.seen.push({ setup, provider });
      gathered.set(key, group);
    }
  }

  return [...gathered.entries()].map(([key, { kind, url, seen }]): PlannedClient => {
    const [first] = seen;
    const name = (first?.provider.name.trim() || first?.provider.implementation || key).slice(
      0,
      80,
    );
    const from = [...new Set(seen.map(({ setup }) => setup.source.name))];
    const implementation = first?.provider.implementation ?? '';

    if (kind === null || url === null) {
      return {
        report: {
          key,
          name,
          implementation,
          kind,
          url,
          from,
          standing: 'unsupported',
          notes: [
            kind === null
              ? saying('requests.arrImport.valenceCannotUseClientYet', { client: implementation })
              : saying('requests.arrImport.itListsNoHost'),
          ],
        },
        draft: null,
        existing: null,
        secrets: [],
      };
    }

    const asked: ArrImportSecret[] = [];

    const secretOf = (field: ArrImportSecret['field']): string => {
      const values = seen
        .map(({ provider }) => fieldsOf(provider.fields).text(field))
        .filter((value) => value !== '');
      const plain = values.find((value) => !isMasked(value));

      if (plain !== undefined || values.length === 0) {
        return plain ?? '';
      }

      const secretKey = `client:${key}:${field}`;

      asked.push({ key: secretKey, field, item: name, from });

      return secrets[secretKey] ?? '';
    };

    const notes: Said[] = [];
    const { categories, isKept } = categoriesOf(seen);
    const host = first === undefined ? '' : fieldsOf(first.provider.fields).text('host');
    const remote = seen
      .flatMap(({ setup }) => setup.remotePaths)
      .find((mapping) => mapping.host.toLowerCase() === host.toLowerCase());
    const username =
      seen
        .map(({ provider }) => fieldsOf(provider.fields).text('username'))
        .find((value) => value !== '') ?? '';
    const priority = Math.min(...seen.map(({ provider }) => provider.priority));
    const kept = existing.find((record) => record.kind === kind && sameAddress(record.url, url));

    if (!isKept) {
      notes.push(saying('requests.arrImport.someCategoriesKeepValencesOwn'));
    }

    return {
      report: {
        key,
        name,
        implementation,
        kind,
        url,
        from,
        standing: kept === undefined ? 'new' : 'kept',
        notes,
      },
      draft: {
        name,
        kind,
        url,
        username: username.slice(0, 200),
        password: secretOf('password'),
        apiKey: secretOf('apiKey'),
        categories,
        remotePath: remote?.remotePath ?? '',
        localPath: remote === undefined ? '' : mapArrPath(remote.localPath, mappings),
        priority: Math.min(50, Math.max(1, Number.isFinite(priority) ? priority : 25)),
        isEnabled: seen.some(({ provider }) => provider.enable),
      },
      existing: kept ?? null,
      secrets: asked,
    };
  });
};

export type { PlannedClient };

export { plannedClientsOf };
