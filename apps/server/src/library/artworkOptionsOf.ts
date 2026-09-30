import { rankLanguage } from '@ValenceServer/library/pickLogo';
import type { ArtworkOption } from '@ValenceContracts/schemas/ArtworkChoice';

type CatalogueImage = {
  file_path: string;
  iso_639_1?: string | null | undefined;
  width: number;
  height: number;
  vote_average: number;
  vote_count: number;
};

const PREVIEW_SIZES = { poster: 'w342', backdrop: 'w780', logo: 'w500' } as const;

/**
 * Lays out the pictures a catalogue holds of one kind as choices for somebody picking artwork by
 * hand, best guesses first: the house's language, then pictures with no lettering, then the title's
 * own language, then everything else, and within each what people rated highest. Each carries the
 * full-size address that is kept once chosen and a smaller one to show while choosing.
 *
 * @param images - What the catalogue listed.
 * @param kind - Which kind of picture these are, which decides how small the preview is.
 * @param base - Where the catalogue serves its images from.
 * @param options - The language the house reads, and the one the title was made in.
 * @returns The pictures, in the order they are offered.
 */
const artworkOptionsOf = (
  images: readonly CatalogueImage[],
  kind: keyof typeof PREVIEW_SIZES,
  base: string,
  options: { language?: string; originalLanguage?: string | null } = {},
): ArtworkOption[] => {
  const wanted = options.language ?? 'en';
  const original = options.originalLanguage ?? null;

  return [...images]
    .sort(
      (left, right) =>
        rankLanguage(left.iso_639_1 ?? null, wanted, original) -
          rankLanguage(right.iso_639_1 ?? null, wanted, original) ||
        right.vote_average - left.vote_average ||
        right.vote_count - left.vote_count ||
        right.width - left.width,
    )
    .map((image) => ({
      url: `${base}/original${image.file_path}`,
      previewUrl: `${base}/${PREVIEW_SIZES[kind]}${image.file_path}`,
      language: image.iso_639_1 ?? null,
      width: Math.max(0, Math.round(image.width)),
      height: Math.max(0, Math.round(image.height)),
      votes: Math.max(0, Math.round(image.vote_count)),
    }));
};

export type { CatalogueImage };

export { artworkOptionsOf };
