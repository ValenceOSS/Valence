import type { Said } from '@ValenceI18n/SaidSchema';
import type { PathMapping } from '@ValenceContracts/schemas/MediaImport';
import { matchSourceItem } from './matchSourceItem';
import type { ItemMatch } from './matchSourceItem';
import type { ValenceIndex } from './readValenceIndex';
import type { SourceItem, SourceLibrary, SourceReader } from './SourceReader';

type SourceCatalogue = {
  libraries: SourceLibrary[];
  items: SourceItem[];
  byId: Map<string, SourceItem>;
  matches: Map<string, ItemMatch>;
  unmatched: { item: SourceItem; reason: Said }[];
};

type CatalogueReading = {
  reader: SourceReader;
  index: ValenceIndex;
  mappings: readonly PathMapping[];
  tmdbOfTvdb: (tvdbId: number) => Promise<number | null>;
  onLibrary: (done: number, total: number, name: string) => void;
};

const MATCHED_KINDS = new Set(['movie', 'series', 'episode', 'track']);

/**
 * Reads everything a source's libraries hold and finds each film, programme, episode and track in
 * Valence, looking up the programmes the source knows only by their TVDB id.
 *
 * @param reading - The source, what Valence holds, how paths move, how to turn a TVDB id into a
 *   TMDb one, and who to tell as each library is read.
 * @returns The libraries, the items, and what each matched or why it did not.
 */
const readSourceCatalogue = async ({
  reader,
  index,
  mappings,
  tmdbOfTvdb,
  onLibrary,
}: CatalogueReading): Promise<SourceCatalogue> => {
  const libraries = await reader.libraries();
  const items: SourceItem[] = [];

  for (const [done, library] of libraries.entries()) {
    onLibrary(done, libraries.length, library.name);
    items.push(...(await reader.items(library)));
  }

  const byId = new Map(items.map((item) => [item.id, item]));
  const lookedUp = new Map<string, string>();
  const tvdbIds = new Set(
    items
      .filter((item) => item.kind === 'series' && item.ids.tmdb === null && item.ids.tvdb !== null)
      .flatMap((item) => (item.ids.tvdb === null ? [] : [item.ids.tvdb])),
  );

  for (const tvdb of tvdbIds) {
    const number = Number.parseInt(tvdb, 10);
    const tmdb = Number.isNaN(number) ? null : await tmdbOfTvdb(number).catch(() => null);

    if (tmdb !== null) {
      lookedUp.set(tvdb, tmdb.toString());
    }
  }

  const matches = new Map<string, ItemMatch>();
  const unmatched: SourceCatalogue['unmatched'] = [];

  for (const item of items) {
    if (!MATCHED_KINDS.has(item.kind)) {
      continue;
    }

    const match = matchSourceItem(item, { index, mappings, parents: byId, tmdbOfTvdb: lookedUp });

    matches.set(item.id, match);

    if (match.kind === 'unmatched') {
      unmatched.push({ item, reason: match.reason });
    }
  }

  return { libraries, items, byId, matches, unmatched };
};

export type { SourceCatalogue };

export { readSourceCatalogue };
