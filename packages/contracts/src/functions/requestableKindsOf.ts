import { libraryKindOf } from '@ValenceContracts/functions/libraryKindOf';
import { MEDIA_REQUEST_KINDS } from '@ValenceContracts/schemas/MediaRequest';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { MediaRequestKind } from '@ValenceContracts/schemas/MediaRequest';

/**
 * The kinds of title that can be asked for on a server: each one a library of its kind takes
 * requests for, films for a films library, artists and albums for a music library, and so on.
 *
 * @param libraries - The server's libraries.
 * @returns The kinds, in the order kinds are listed.
 */
const requestableKindsOf = (
  libraries: readonly Pick<Library, 'kind' | 'takesRequests'>[],
): MediaRequestKind[] =>
  MEDIA_REQUEST_KINDS.filter((kind) =>
    libraries.some((library) => library.kind === libraryKindOf(kind) && library.takesRequests),
  );

export { requestableKindsOf };
