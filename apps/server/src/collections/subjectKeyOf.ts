import type { CollectionSubject } from '@ValenceContracts/schemas/Collection';

/**
 * One string naming what an entry is of, so a film and a programme that happen to share an id are
 * never taken for the same entry when a list is cleared of repeats.
 *
 * @param subject - A film or a programme.
 * @returns The key.
 */
const subjectKeyOf = (subject: CollectionSubject): string =>
  'mediaItemId' in subject ? `film:${subject.mediaItemId}` : `series:${subject.seriesId}`;

export { subjectKeyOf };
