import { showSlug } from '@ValenceCore/functions/showSlug';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Which programme something belongs to, by the id its library files the programme under.
 *
 * A programme the catalogue matched has an id of its own; one it did not is known by its name, as
 * the library knows it.
 *
 * @param media - An episode, or a card standing for a programme.
 * @returns The programme's id, or nothing for a film.
 */
const showIdOf = (media: MediaSummary): string | null => {
  const id = media.seriesId ?? showSlug(media.seriesTitle ?? '');

  return id === '' ? null : id;
};

export { showIdOf };
