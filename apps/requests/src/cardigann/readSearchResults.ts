import { createHash } from 'node:crypto';
import { load } from 'cheerio';
import { applyFilters } from '@ValenceRequests/cardigann/applyFilters';
import { buildMagnet } from '@ValenceRequests/cardigann/buildMagnet';
import { interpretField } from '@ValenceRequests/cardigann/interpretField';
import { JsonNodeSchema } from '@ValenceRequests/cardigann/JsonNodeSchema';
import { readHtmlSelector } from '@ValenceRequests/cardigann/readHtmlSelector';
import { readJsonPath } from '@ValenceRequests/cardigann/readJsonPath';
import { readJsonSelector } from '@ValenceRequests/cardigann/readJsonSelector';
import { renderTemplate } from '@ValenceRequests/cardigann/renderTemplate';
import { selectJson } from '@ValenceRequests/cardigann/selectJson';
import { readAnyDate } from '@ValenceRequests/cardigann/readAnyDate';
import { isJsonList } from '@ValenceRequests/cardigann/isJsonList';
import { IndexerFailure } from '@ValenceRequests/indexers/IndexerFailure';
import type { Cheerio, CheerioAPI } from 'cheerio';
import type { AnyNode } from 'domhandler';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type {
  CardigannDefinition,
  CardigannSelector,
} from '@ValenceRequests/cardigann/CardigannDefinitionSchema';
import type { CategoryMap } from '@ValenceRequests/cardigann/createCategoryMap';
import type { FilterContext } from '@ValenceRequests/cardigann/FilterContext';
import type { JsonNode } from '@ValenceRequests/cardigann/JsonNode';
import type { ReleaseDraft } from '@ValenceRequests/cardigann/ReleaseDraft';
import type { SearchRequest } from '@ValenceRequests/cardigann/buildSearchRequests';
import type { TemplateValue } from '@ValenceRequests/cardigann/TemplateVariables';

type ReadSearchResultsOptions = {
  definition: CardigannDefinition;
  request: SearchRequest;
  body: string;
  categories: CategoryMap;
  indexer: { id: string; name: string };
  nowMs: number;
};

type FieldReader = (
  block: CardigannSelector,
  variables: FilterContext,
  isRequired: boolean,
) => string | null;

const IGNORED_WHEN_MISSING = new Set([
  'imdb',
  'imdbid',
  'tmdbid',
  'rageid',
  'tvdbid',
  'tvmazeid',
  'traktid',
  'doubanid',
  'poster',
  'banner',
  'description',
  'genre',
]);

const COMMON_WORDS = new Set(['and', 'the', 'an', 'of']);

/**
 * A release with nothing read into it yet.
 *
 * @returns The draft.
 */
const aDraft = (): ReleaseDraft => ({
  title: '',
  description: '',
  downloadUrl: null,
  magnetUrl: null,
  infoUrl: null,
  infoHash: null,
  categories: [],
  sizeBytes: null,
  seeders: null,
  leechers: null,
  grabs: null,
  publishedAt: null,
  downloadFactor: null,
  uploadFactor: null,
  minimumRatio: null,
  minimumSeedSeconds: null,
});

/**
 * Reads every field of one row into a release, in the definition's order, each able to read the ones
 * before it through `.Result`. A required field that cannot be read loses the row; an optional one
 * falls back to its default, or is simply left out.
 *
 * @param options - What the search was.
 * @param read - How to read a field from this row.
 * @returns The release so far, or null where a required field was missing.
 */
const readRow = (options: ReadSearchResultsOptions, read: FieldReader): ReleaseDraft | null => {
  const draft = aDraft();
  const variables: Record<string, TemplateValue> = { ...options.request.variables };
  const context = {
    baseUrl: options.request.url,
    categories: options.categories,
    nowMs: options.nowMs,
  };

  for (const [key, block] of options.definition.search.fields) {
    const [name = key, ...modifiers] = key.split('|');
    const isOptional =
      IGNORED_WHEN_MISSING.has(key) || modifiers.includes('optional') || block.optional;
    const filterContext: FilterContext = {
      variables,
      encoding: options.definition.encoding,
      nowMs: options.nowMs,
    };

    try {
      let value = read(block, filterContext, !isOptional);

      if (isOptional && (value === null || value.trim() === '')) {
        const fallback =
          block.default === undefined ? '' : renderTemplate(block.default, variables);

        if (fallback.trim() === '') {
          variables[`.Result.${name}`] = null;
          continue;
        }

        value = fallback;
      }

      variables[`.Result.${name}`] = interpretField(name, value ?? '', draft, modifiers, context);
    } catch {
      if (!isOptional) {
        return null;
      }

      variables[`.Result.${name}`] = null;
    }
  }

  return draft;
};

/**
 * Turns a finished draft into a release, where it has what one needs: a title, and somewhere to
 * fetch it from. A public site's info hash becomes a magnet link, and a magnet link's hash is read
 * back out of it.
 *
 * @param draft - What the row gave.
 * @param options - What the search was.
 * @returns The release, or null.
 */
const finish = (draft: ReleaseDraft, options: ReadSearchResultsOptions): Release | null => {
  const title = draft.title.replace(/\s+/g, ' ').trim();
  const hashFromMagnet = /xt=urn:btih:([^&]+)/i.exec(draft.magnetUrl ?? '')?.[1] ?? null;
  const infoHash = draft.infoHash ?? hashFromMagnet;
  const magnetUrl =
    draft.magnetUrl ??
    (infoHash !== null && options.definition.type !== 'private'
      ? buildMagnet(infoHash, title)
      : null);

  if (title === '' || (draft.downloadUrl === null && magnetUrl === null)) {
    return null;
  }

  const identity = draft.downloadUrl ?? magnetUrl ?? draft.infoUrl ?? title;

  return {
    id: createHash('sha1').update(`${options.indexer.id}:${identity}`).digest('hex'),
    title,
    indexerId: options.indexer.id,
    indexerName: options.indexer.name,
    protocol: 'torrent',
    sizeBytes: draft.sizeBytes,
    seeders: draft.seeders,
    leechers: draft.leechers,
    grabs: draft.grabs,
    publishedAt: draft.publishedAt,
    categories: draft.categories.filter((category) => category < 100_000),
    downloadUrl: draft.downloadUrl,
    magnetUrl,
    infoUrl: draft.infoUrl,
    infoHash,
    downloadFactor: draft.downloadFactor,
    uploadFactor: draft.uploadFactor,
    minimumRatio: draft.minimumRatio,
    minimumSeedSeconds: draft.minimumSeedSeconds,
  };
};

/**
 * Keeps only the releases that mention every word searched for, for a definition whose rows ask for
 * `andmatch` because the site's own search is loose.
 *
 * @param releases - What the site found.
 * @param words - What was searched for.
 * @returns The releases that match.
 */
const matchingEveryWord = (
  releases: readonly Release[],
  descriptions: ReadonlyMap<string, string>,
  words: string,
): Release[] => {
  const terms = words
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((term) => term.length > 1 && !COMMON_WORDS.has(term));

  return releases.filter((release) =>
    terms.every((term) =>
      `${release.title} ${descriptions.get(release.id) ?? ''}`.toLowerCase().includes(term),
    ),
  );
};

/**
 * Reads the rows of an HTML or XML answer, merging any a definition spreads across several, and
 * finding the date in a header row above for a definition whose rows carry none.
 *
 * @param options - What the search was.
 * @returns The drafts read, with each one's description.
 */
const readMarkup = (options: ReadSearchResultsOptions): ReleaseDraft[] => {
  const { search, encoding } = options.definition;
  const context: FilterContext = {
    variables: options.request.variables,
    encoding,
    nowMs: options.nowMs,
  };
  const body = applyFilters(options.body, search.preprocessingfilters, context);
  const isXml = options.request.path.response?.type === 'xml';
  const $: CheerioAPI = load(body, { xml: isXml });
  let rows: Cheerio<AnyNode>[] = [];

  try {
    rows = $(renderTemplate(search.rows.selector ?? '', options.request.variables))
      .toArray()
      .map((row) => $(row));
  } catch {
    rows = [];
  }

  if (search.rows.after > 0) {
    const merged: Cheerio<AnyNode>[] = [];

    for (let at = 0; at < rows.length; at += search.rows.after + 1) {
      const row = rows[at];

      if (row !== undefined) {
        for (const following of rows.slice(at + 1, at + 1 + search.rows.after)) {
          row.append(following.contents());
        }

        merged.push(row);
      }
    }

    rows = merged;
  }

  return rows.flatMap((row) => {
    const draft = readRow(options, (block, filterContext, isRequired) =>
      readHtmlSelector($, row, block, filterContext, isRequired),
    );

    if (draft === null) {
      return [];
    }

    const headers = search.rows.dateheaders;

    if (draft.publishedAt === null && headers !== undefined) {
      let previous = row.prev().length > 0 ? row.prev() : row.parent().prev();

      while (previous.length > 0) {
        const found = readHtmlSelector($, previous, headers, context, false);

        if (found !== null) {
          draft.publishedAt = readAnyDate(found, options.nowMs)?.toISOString() ?? null;
          break;
        }

        previous = previous.prev().length > 0 ? previous.prev() : previous.parent().prev();
      }
    }

    return [draft];
  });
};

/**
 * Reads the rows of a JSON answer: the list the rows selector points at, each row's own list where
 * the definition names an attribute, and several releases to a row where it says so. A field whose
 * selector begins `..` reads from the row itself rather than its attribute.
 *
 * @param options - What the search was.
 * @returns The drafts read.
 * @throws IndexerFailure where the answer is not JSON, or has no rows where it must.
 */
const readJson = (options: ReadSearchResultsOptions): ReleaseDraft[] => {
  const { search } = options.definition;
  const noResults = options.request.path.response?.noResultsMessage;

  if (
    noResults !== undefined &&
    (noResults === '' ? options.body.trim() === '' : options.body.includes(noResults))
  ) {
    return [];
  }

  let root: JsonNode;

  try {
    root = JsonNodeSchema.parse(JSON.parse(options.body));
  } catch {
    throw new IndexerFailure('The site answered a search with JSON that could not be read');
  }

  const context: FilterContext = {
    variables: options.request.variables,
    encoding: options.definition.encoding,
    nowMs: options.nowMs,
  };

  if (search.rows.count !== undefined) {
    const count = Number(readJsonSelector(root, search.rows.count, context, false) ?? 'NaN');

    if (Number.isInteger(count) && count < 1) {
      return [];
    }
  }

  const selector = renderTemplate(search.rows.selector ?? '', options.request.variables);
  const conditionAt = selector.search(/:(has|not|contains)\(/);
  const path = conditionAt === -1 ? selector : selector.slice(0, conditionAt);
  const conditions = conditionAt === -1 ? '' : selector.slice(conditionAt);
  const list = readJsonPath(root, path);

  if (!isJsonList(list)) {
    if (search.rows.missingAttributeEqualsNoResults) {
      return [];
    }

    throw new IndexerFailure('The site answered a search without the rows its definition expects');
  }

  return list.flatMap((row: JsonNode) => {
    if (conditions !== '' && selectJson(row, conditions) === undefined) {
      return [];
    }

    const inner =
      search.rows.attribute === undefined ? row : readJsonPath(row, search.rows.attribute);

    if (inner === undefined) {
      return [];
    }

    const entries: readonly JsonNode[] =
      search.rows.multiple && isJsonList(inner) ? inner : [inner];

    return entries.flatMap((entry) => {
      const draft = readRow(options, (block, filterContext, isRequired) =>
        readJsonSelector(
          block.selector?.startsWith('..') === true ? row : entry,
          block,
          filterContext,
          isRequired,
        ),
      );

      return draft === null ? [] : [draft];
    });
  });
};

/**
 * Reads what a site answered one search request with into releases, the way its definition says:
 * HTML by default, or JSON or XML where the search path says so.
 *
 * @param options - The definition, the request made, what came back, how its categories map, which
 *   indexer it is and the clock.
 * @returns The releases found.
 * @throws IndexerFailure where the answer could not be read at all.
 */
const readSearchResults = (options: ReadSearchResultsOptions): Release[] => {
  const drafts =
    options.request.path.response?.type === 'json' ? readJson(options) : readMarkup(options);
  const descriptions = new Map<string, string>();
  const finished = drafts.flatMap((draft) => {
    const release = finish(draft, options);

    if (release === null) {
      return [];
    }

    descriptions.set(release.id, draft.description);

    return [release];
  });
  const words = String(options.request.variables['.Query.Q'] ?? '');
  const isIdSearch = options.request.variables['.Query.IsIdSearch'] === 'True';
  const isStrict = options.definition.search.rows.filters.some(
    (filter) => filter.name === 'andmatch',
  );

  return isStrict && words.trim() !== '' && !isIdSearch
    ? matchingEveryWord(finished, descriptions, words)
    : finished;
};

export type { ReadSearchResultsOptions };

export { readSearchResults };
