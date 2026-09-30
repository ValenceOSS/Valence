import type { Said } from './SaidSchema';
import { saying } from './saying';
import { sayVerbatim } from './sayVerbatim';

/**
 * Several things named together the way the language lists them — in English, commas between and
 * "and" before the last.
 *
 * @param items - What to name, at least one: names as they are, or things said.
 */
const sayingAll = ([first, second, ...others]: readonly [
  string | Said,
  ...(string | Said)[],
]): Said => {
  if (second === undefined) {
    return typeof first === 'string' ? sayVerbatim(first) : first;
  }

  return others.length === 0
    ? saying('common.list.pair', { first, second })
    : saying('common.list.series', { first, rest: sayingAll([second, ...others]) });
};

export { sayingAll };
