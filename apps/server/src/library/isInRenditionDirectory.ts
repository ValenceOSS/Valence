const RENDITION_DIRECTORY = '.valence';

/**
 * Whether a path sits in the folder Valence keeps its own files in, at the top of a library.
 *
 * The scanner walks a library root and upserts every media file it finds, so an encode written
 * inside the library would be indexed as a second copy of the film — its own metadata lookup, its
 * own artwork, its own watch progress, its own thumbnails. That is the failure this exists to
 * prevent, and it has to be prevented by a rule rather than by a naming convention somebody could
 * collide with: a rendition attaches to an item by its identifier, and is never discovered.
 *
 * One folder per library rather than one beside each film, because a library is a thing an operator
 * thinks about and can look inside, and four hundred hidden directories scattered through a shelf
 * is not. It sits under the library root rather than elsewhere so that swapping an encode into
 * place stays a rename rather than becoming a copy across a volume boundary.
 *
 * Only this one name, deliberately. Skipping every directory beginning with a dot would be a
 * broader and arguably better rule, and it would also silently remove anything an existing library
 * happens to keep in one — which is a change to what somebody already has, and belongs to its own
 * decision rather than to this one.
 *
 * @param path - The file's path.
 * @returns Whether it is one of Valence's own rather than one of the library's.
 */
const isInRenditionDirectory = (path: string): boolean =>
  path.split('/').includes(RENDITION_DIRECTORY);

export { RENDITION_DIRECTORY, isInRenditionDirectory };
