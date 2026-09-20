import type { Concern } from '@ValenceScreens/components/AdminArea/collectConcerns';

/**
 * What a dismissal of a concern is remembered by: which concern it is and what it says, so that one
 * dismissed for one indexer comes back when it is another indexer that fails, while its detail —
 * which may be a figure that moves every reading — is left out.
 *
 * @param concern - The concern.
 * @returns Such as `requests-indexers:The indexer 1337x keeps failing`.
 */
const concernKey = (concern: Pick<Concern, 'id' | 'title'>): string =>
  `${concern.id}:${concern.title}`;

export { concernKey };
