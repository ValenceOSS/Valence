import { readAnyDate } from '@ValenceRequests/cardigann/readAnyDate';
import { readNumber } from '@ValenceRequests/cardigann/readNumber';
import { readSize } from '@ValenceRequests/cardigann/readSize';
import type { CategoryMap } from '@ValenceRequests/cardigann/createCategoryMap';
import type { ReleaseDraft } from '@ValenceRequests/cardigann/ReleaseDraft';

type FieldContext = { baseUrl: string; categories: CategoryMap; nowMs: number };

const IMPLAUSIBLE_PEERS = 5_000_000;

/**
 * Resolves a link a page gave against the page it was on.
 *
 * @param value - The link.
 * @param baseUrl - The page.
 * @returns The absolute link, or null where it is not one.
 */
const resolve = (value: string, baseUrl: string): string | null => {
  try {
    return new URL(value, baseUrl).toString();
  } catch {
    return null;
  }
};

/**
 * A count of peers, where a site wrote something believable.
 *
 * @param value - What it wrote.
 * @returns The count, or zero for a figure too large to be true.
 */
const peers = (value: string): number | null => {
  const count = readNumber(value, true);

  return count === null ? null : count < IMPLAUSIBLE_PEERS ? Math.max(count, 0) : 0;
};

/**
 * Takes one field's value into the release it describes, by the field's name, and says what the
 * field now reads as for `.Result` — a link resolved, a size in bytes, a date as ISO 8601. A name the
 * format does not reserve is a working value, kept only for later fields to read.
 *
 * @param name - The field's name, without its modifiers.
 * @param value - What was read.
 * @param draft - The release so far, which this changes.
 * @param modifiers - Such as `append`, which adds to a title rather than replacing it.
 * @param context - The page the value came from, how categories map, and the clock.
 * @returns The value as `.Result` gives it.
 */
const interpretField = (
  name: string,
  value: string,
  draft: ReleaseDraft,
  modifiers: readonly string[],
  context: FieldContext,
): string | null => {
  switch (name) {
    case 'download': {
      if (value === '') {
        draft.downloadUrl = null;

        return null;
      }

      if (value.startsWith('magnet:')) {
        draft.magnetUrl = value;

        return value;
      }

      draft.downloadUrl = resolve(value, context.baseUrl);

      return draft.downloadUrl;
    }
    case 'magnet':
      draft.magnetUrl = value === '' ? draft.magnetUrl : value;

      return value;
    case 'infohash':
      draft.infoHash = value === '' ? draft.infoHash : value;

      return value;
    case 'details':
      draft.infoUrl = resolve(value, context.baseUrl);

      return draft.infoUrl;
    case 'comments': {
      const url = resolve(value, context.baseUrl);

      draft.infoUrl ??= url;

      return url;
    }
    case 'title':
      draft.title = modifiers.includes('append') ? draft.title + value : value;

      return draft.title;
    case 'description':
      draft.description = modifiers.includes('append') ? draft.description + value : value;

      return draft.description;
    case 'category':
    case 'categorydesc': {
      const found =
        name === 'category'
          ? context.categories.fromTracker(value)
          : context.categories.fromDescription(value);

      draft.categories = modifiers.includes('noappend')
        ? found
        : [...new Set([...draft.categories, ...found])];

      return draft.categories.join(',');
    }
    case 'size':
      draft.sizeBytes = readSize(value);

      return draft.sizeBytes?.toString() ?? null;
    case 'seeders':
      draft.seeders = peers(value);

      return draft.seeders?.toString() ?? null;
    case 'leechers':
      draft.leechers = peers(value);

      return draft.leechers?.toString() ?? null;
    case 'grabs':
      draft.grabs = readNumber(value, true);

      return draft.grabs?.toString() ?? null;
    case 'date':
      draft.publishedAt = readAnyDate(value, context.nowMs)?.toISOString() ?? null;

      return draft.publishedAt;
    case 'downloadvolumefactor':
      draft.downloadFactor = readNumber(value);

      return draft.downloadFactor?.toString() ?? null;
    case 'uploadvolumefactor':
      draft.uploadFactor = readNumber(value);

      return draft.uploadFactor?.toString() ?? null;
    case 'minimumratio':
      draft.minimumRatio = readNumber(value);

      return draft.minimumRatio?.toString() ?? null;
    case 'minimumseedtime':
      draft.minimumSeedSeconds = readNumber(value, true);

      return draft.minimumSeedSeconds?.toString() ?? null;
    default:
      return value;
  }
};

export type { FieldContext };

export { interpretField };
