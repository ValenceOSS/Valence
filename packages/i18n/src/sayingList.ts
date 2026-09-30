import type { Said } from './SaidSchema';
import { saying } from './saying';

/**
 * Several things said as one, each after the one before, in the way the language runs a list of
 * separate reasons together.
 *
 * @param saids - What was said, at least one.
 */
const sayingList = ([first, second, ...others]: readonly [Said, ...Said[]]): Said =>
  second === undefined
    ? first
    : saying('common.list.andAlso', { first, rest: sayingList([second, ...others]) });

export { sayingList };
