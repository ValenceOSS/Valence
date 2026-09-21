import { join, resolve, sep } from 'node:path';
import { isUploadableTo } from '@ValenceContracts/functions/isUploadableTo';
import type { LibraryKind } from '@ValenceContracts/schemas/Library';

type UploadPlan =
  { kind: 'planned'; destination: string } | { kind: 'badPath' } | { kind: 'refused' };

const LONGEST_NAME = 255;

const MOST_SEGMENTS = 12;

/**
 * Whether one part of a path is a plain name, and not a way of walking somewhere else or of reaching
 * something Valence keeps for itself: empty, a dot or two, one starting with a dot, or one holding
 * a slash, a backslash or a null character.
 *
 * @param segment - One part of the path.
 * @returns Whether it is a plain name.
 */
const isPlainName = (segment: string): boolean =>
  segment !== '' &&
  segment.length <= LONGEST_NAME &&
  !segment.startsWith('.') &&
  !/[\\\0]/.test(segment);

/**
 * Works out where an uploaded file goes inside a library, from the path the browser gave it, and
 * whether the library would read it at all.
 *
 * The path is relative to the library's root and may run through folders, which is how a whole
 * folder is uploaded with its shape. Every part must be a plain name, and the result is checked to
 * be inside the root once resolved, so nothing sent here can write outside the library or into the
 * folder Valence keeps beside its media. A file the library would not read is refused rather than
 * left sitting where a scan will never look.
 *
 * @param root - The library's own folder.
 * @param relativePath - Where in it the file goes, with `/` between parts.
 * @param kind - The kind of library.
 * @returns Where to put it, or why not.
 */
const planUpload = (root: string, relativePath: string, kind: LibraryKind): UploadPlan => {
  const segments = relativePath.split('/');

  if (segments.length > MOST_SEGMENTS || !segments.every(isPlainName)) {
    return { kind: 'badPath' };
  }

  const inside = resolve(root);
  const destination = resolve(join(inside, ...segments));

  if (!destination.startsWith(`${inside}${sep}`)) {
    return { kind: 'badPath' };
  }

  return isUploadableTo(kind, relativePath)
    ? { kind: 'planned', destination }
    : { kind: 'refused' };
};

export type { UploadPlan };

export { planUpload };
