import { decodeHTML, encodeHTML } from 'entities';
import { decodeUrlText } from '@ValenceRequests/cardigann/decodeUrlText';
import { encodeUrlText } from '@ValenceRequests/cardigann/encodeUrlText';
import { parseDateFormat } from '@ValenceRequests/cardigann/parseDateFormat';
import { readAnyDate } from '@ValenceRequests/cardigann/readAnyDate';
import { readRelativeTime } from '@ValenceRequests/cardigann/readRelativeTime';
import { renderTemplate } from '@ValenceRequests/cardigann/renderTemplate';
import { selectJson } from '@ValenceRequests/cardigann/selectJson';
import { translateRegex } from '@ValenceRequests/cardigann/translateRegex';
import { translateReplacement } from '@ValenceRequests/cardigann/translateReplacement';
import { JsonNodeSchema } from '@ValenceRequests/cardigann/JsonNodeSchema';
import type { CardigannFilter } from '@ValenceRequests/cardigann/CardigannDefinitionSchema';
import type { FilterContext } from '@ValenceRequests/cardigann/FilterContext';

const WORD_BREAKS = /[,\s/)(.;[\]"|:]+/;

/**
 * The filter's argument at a position, whichever way the definition wrote it.
 *
 * @param args - The argument or arguments.
 * @param at - Which.
 * @returns The argument, or an empty string.
 */
const argument = (args: CardigannFilter['args'], at = 0): string =>
  args === null ? '' : typeof args === 'string' ? (at === 0 ? args : '') : (args[at] ?? '');

/**
 * Writes a moment, or leaves the text as it was where no moment could be read.
 *
 * @param moment - The moment read.
 * @param text - What it was read from.
 * @returns The moment as ISO 8601, or the text.
 */
const asDate = (moment: Date | null, text: string): string => moment?.toISOString() ?? text;

/**
 * Applies one filter.
 *
 * @param text - The value so far.
 * @param filter - The filter.
 * @param context - The variables its arguments may name, the site's character set and the clock.
 * @returns The value after it.
 */
const applyFilter = (
  text: string,
  { name, args }: CardigannFilter,
  context: FilterContext,
): string => {
  const first = argument(args);
  const second = argument(args, 1);

  switch (name) {
    case 'querystring': {
      const query = text.includes('?') ? (text.split('?', 2)[1] ?? '').split('#')[0] : text;

      return new URLSearchParams(query).get(first) ?? '';
    }
    case 'dateparse':
    case 'timeparse':
      return asDate(parseDateFormat(text, first), text);
    case 'timeago':
    case 'reltime':
      return asDate(readRelativeTime(text, context.nowMs), text);
    case 'fuzzytime':
      return asDate(readAnyDate(text, context.nowMs, first.toUpperCase().includes('UK')), text);
    case 'regexp':
      return translateRegex(first).exec(text)?.[1] ?? '';
    case 're_replace':
      return text.replace(
        translateRegex(first, true),
        translateReplacement(renderTemplate(second, context.variables)),
      );
    case 'split': {
      const parts = text.split(first.slice(0, 1));
      const position = Number(second);

      return parts.at(position < 0 ? parts.length + position : position) ?? '';
    }
    case 'replace':
      return text.replaceAll(first, renderTemplate(second, context.variables));
    case 'trim':
      return first === ''
        ? text.trim()
        : text.replace(
            new RegExp(
              `^[${first.replace(/[\\\]^-]/g, '\\$&')}]+|[${first.replace(/[\\\]^-]/g, '\\$&')}]+$`,
              'g',
            ),
            '',
          );
    case 'prepend':
      return renderTemplate(first, context.variables) + text;
    case 'append':
      return text + renderTemplate(first, context.variables);
    case 'tolower':
      return text.toLowerCase();
    case 'toupper':
      return text.toUpperCase();
    case 'urldecode':
      return decodeUrlText(text, context.encoding);
    case 'urlencode':
      return encodeUrlText(text, context.encoding);
    case 'htmldecode':
      return decodeHTML(text);
    case 'htmlencode':
      return encodeHTML(text);
    case 'validfilename':
      return text.replace(/[<>:"/\\|?*\u0000-\u001F]/g, '');
    case 'diacritics':
      return first === 'replace'
        ? text
            .normalize('NFD')
            .replace(/\p{Mn}/gu, '')
            .normalize('NFC')
        : text;
    case 'jsonjoinarray': {
      const selected = selectJson(
        JsonNodeSchema.parse(JSON.parse(text)),
        first.replace(/^\$\.?/, ''),
      );

      return Array.isArray(selected)
        ? selected
            .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
            .join(second)
        : '';
    }
    case 'validate': {
      const allowed = new Set(first.toLowerCase().split(WORD_BREAKS).filter(Boolean));

      return [
        ...new Set(
          text
            .toLowerCase()
            .split(WORD_BREAKS)
            .filter((word) => allowed.has(word)),
        ),
      ]
        .map((word) => word.replaceAll('_', ' '))
        .join(', ');
    }
    default:
      return text;
  }
};

/**
 * Applies a definition's filters to a value in turn — the Cardigann filters that extract part of a
 * link, reword a date, strip a prefix and so on. A filter whose pattern cannot run leaves the value
 * as it was rather than failing the whole row, and a filter this engine does not know, such as the
 * `strdump` definitions leave in for debugging, does nothing.
 *
 * Dates come out as ISO 8601, which is what the rest of the engine reads.
 *
 * @param text - The value.
 * @param filters - The filters, in order.
 * @param context - The variables their arguments may name, the site's character set and the clock.
 * @returns The value after them all.
 */
const applyFilters = (
  text: string,
  filters: readonly CardigannFilter[],
  context: FilterContext,
): string =>
  filters.reduce((value, filter) => {
    try {
      return applyFilter(value, filter, context);
    } catch {
      return value;
    }
  }, text);

export { applyFilters };
