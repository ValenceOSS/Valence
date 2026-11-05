import type { CatalogueDescription } from '@ValenceServer/library/MetadataProvider';
import type { TitleField, TitleValue } from '@ValenceContracts/schemas/TitleEdit';

/**
 * Reads what a catalogue entry would give each field of a title matched to it, for the fields the
 * catalogue fills; the rest, such as a sort title or a note, are left out, since matching does not
 * change them.
 *
 * @param description - The catalogue's description of the entry.
 * @returns The value of each field it fills.
 */
const valuesOfCandidate = (
  description: CatalogueDescription,
): Partial<Record<TitleField, TitleValue>> => {
  const listed = (words: string[] | undefined): string[] | null =>
    words === undefined || words.length === 0 ? null : words;

  return {
    title: description.title === '' ? null : description.title,
    originalTitle: description.originalTitle ?? null,
    tagline: description.tagline ?? null,
    overview: description.overview,
    releaseDate: description.releaseDate ?? null,
    status: description.status ?? null,
    genres: listed(description.genres),
    studios: listed(description.studios),
    networks: listed(description.networks),
    certifications:
      description.certifications === undefined ||
      Object.keys(description.certifications).length === 0
        ? null
        : description.certifications,
    rating: description.rating ?? null,
    imdbId: description.imdbId ?? null,
    tvdbId: description.tvdbId ?? null,
    trailer: description.trailerKey,
    cast:
      description.cast.length === 0
        ? null
        : description.cast.map((member) => ({
            personId: member.personId,
            name: member.name,
            role: member.role ?? '',
            imageUrl: member.photoUrl,
          })),
  };
};

export { valuesOfCandidate };
