import { FIELDS_OF_KIND } from '@ValenceContracts/schemas/TitleEdit';
import type { TitleField } from '@ValenceContracts/schemas/TitleEdit';

const NEVER_FROM_TMDB: readonly TitleField[] = ['sortTitle', 'tags', 'note', 'rottenTomatoes'];

const LIVE_FOR_A_SHOW: readonly TitleField[] = ['overview', 'status', 'releaseDate'];

/**
 * The fields of a film or a programme that TMDB can be asked for again on their own: not the ones
 * it never fills, and not a programme's own overview, status and first airing, which are read from
 * it live.
 *
 * @param kind - Whether it is a film or a programme.
 * @returns The fields, in the order the Details tab shows them.
 */
const fieldsToRefresh = (kind: 'film' | 'show'): TitleField[] =>
  FIELDS_OF_KIND[kind].filter(
    (field) =>
      !NEVER_FROM_TMDB.includes(field) && !(kind === 'show' && LIVE_FOR_A_SHOW.includes(field)),
  );

export { fieldsToRefresh };
