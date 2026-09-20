import { applyFilters } from '@ValenceRequests/cardigann/applyFilters';
import { encodeForm } from '@ValenceRequests/cardigann/encodeForm';
import { encodeUrlText } from '@ValenceRequests/cardigann/encodeUrlText';
import { renderTemplate } from '@ValenceRequests/cardigann/renderTemplate';
import type {
  CardigannDefinition,
  CardigannSearchPath,
} from '@ValenceRequests/cardigann/CardigannDefinitionSchema';
import type { CategoryMap } from '@ValenceRequests/cardigann/createCategoryMap';
import type { FormPair } from '@ValenceRequests/cardigann/encodeForm';
import type { SiteRequest } from '@ValenceRequests/cardigann/SiteRequest';
import type {
  TemplateValue,
  TemplateVariables,
} from '@ValenceRequests/cardigann/TemplateVariables';

type SearchRequest = SiteRequest & { path: CardigannSearchPath; variables: TemplateVariables };

type BuildSearchRequestsOptions = {
  definition: CardigannDefinition;
  variables: Readonly<Record<string, TemplateValue>>;
  categories: CategoryMap;
  asked: readonly number[];
  siteLink: string;
  nowMs: number;
};

/**
 * The site categories one path is used for, or null where it is not used for this search.
 *
 * A path with no categories is used for every search. One that names some is used where the search
 * asks for one of them, and one whose list starts with `!` where it asks for anything else. A search
 * that maps to no site categories at all uses every path.
 *
 * @param path - The path.
 * @param mapped - The site categories the search asks for.
 * @returns The categories for this path, or null.
 */
const categoriesFor = (path: CardigannSearchPath, mapped: readonly string[]): string[] | null => {
  if (path.categories === undefined || mapped.length === 0) {
    return [...mapped];
  }

  const isNegated = path.categories[0] === '!';
  const listed = new Set(isNegated ? path.categories.slice(1) : path.categories);
  const inside = mapped.filter((category) => listed.has(category));
  const outside = mapped.filter((category) => !listed.has(category));

  if (isNegated) {
    return outside.length > 0 ? outside : null;
  }

  return inside.length > 0 ? inside : null;
};

/**
 * Builds the requests one search makes of a site, from its definition: a request per search path
 * the search's categories reach, each with the definition's inputs filled in and encoded in the
 * site's own character set, the `.Keywords` its keyword filters produce, and its headers.
 *
 * A `$raw` input is written into the query as it stands, with only the values it names encoded, which
 * is how a definition builds `cat[]=1&cat[]=2`. An input that comes to nothing is left out unless the
 * definition says empty inputs matter. Two paths that come to the same address are asked once.
 *
 * @param options - The definition, the variables so far, how its categories map, the standard
 *   categories asked for, the address in use and the clock.
 * @returns The requests, each with the variables its results are read with.
 */
const buildSearchRequests = ({
  definition,
  variables,
  categories,
  asked,
  siteLink,
  nowMs,
}: BuildSearchRequestsOptions): SearchRequest[] => {
  const { search, encoding } = definition;
  const mapped = categories.toTracker(asked);
  const chosen = mapped.length > 0 ? mapped : categories.defaults;
  const keywords = applyFilters(
    String(variables['.Query.Keywords'] ?? ''),
    search.keywordsfilters,
    {
      variables,
      encoding,
      nowMs,
    },
  );
  const paths: CardigannSearchPath[] =
    search.paths ??
    (search.path === undefined
      ? []
      : [
          {
            path: search.path,
            inputs: {},
            queryseparator: '&',
            inheritinputs: true,
            followredirect: false,
          },
        ]);
  const seen = new Set<string>();
  const requests: SearchRequest[] = [];
  const inPath = (text: string) => encodeUrlText(text, encoding).replaceAll('+', '%20');
  const inQuery = (text: string) => encodeUrlText(text, encoding);

  for (const path of paths) {
    const forPath = categoriesFor(path, chosen);

    if (forPath === null) {
      continue;
    }

    const scope: Record<string, TemplateValue> = {
      ...variables,
      '.Keywords': keywords,
      '.Categories': forPath,
    };
    const url = new URL(renderTemplate(path.path, scope, inPath), siteLink);
    const pairs: FormPair[] = [];

    for (const inputs of [path.inheritinputs ? search.inputs : {}, path.inputs]) {
      for (const [key, template] of Object.entries(inputs)) {
        if (key === '$raw') {
          for (const part of renderTemplate(template, scope, inQuery).split('&')) {
            const [name = '', ...rest] = part.split('=');

            if (name !== '') {
              pairs.push({ key: name, value: rest.join('='), isEncoded: true });
            }
          }
        } else {
          const value = renderTemplate(template, scope);

          if (value.trim() !== '' || search.allowEmptyInputs) {
            pairs.push({ key, value, isEncoded: false });
          }
        }
      }
    }

    const isPost =
      renderTemplate(path.method ?? 'get', scope)
        .trim()
        .toLowerCase() === 'post';
    const form = encodeForm(pairs, encoding);
    const address =
      isPost || form === ''
        ? url.toString()
        : `${url.toString()}${url.search === '' ? '?' : '&'}${form}`;

    if (!isPost && seen.has(address)) {
      continue;
    }

    seen.add(address);
    requests.push({
      url: address,
      method: isPost ? 'POST' : 'GET',
      body: isPost ? form : null,
      headers: Object.fromEntries(
        Object.entries(search.headers).map(([name, value]) => [name, renderTemplate(value, scope)]),
      ),
      path,
      variables: scope,
    });
  }

  return requests;
};

export type { SearchRequest };

export { buildSearchRequests };
