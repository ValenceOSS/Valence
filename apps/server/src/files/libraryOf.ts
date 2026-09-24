import { resolve } from 'node:path';
import { isUnderAny } from '@ValenceServer/library/isUnderAny';
import type { Library } from '@ValenceContracts/schemas/Library';

/**
 * The library a path sits in, where it sits in one — the deepest, where one library's folder is
 * inside another's — so that nothing the file manager touches is ever outside a library.
 *
 * @param libraries - The libraries there are.
 * @param path - The path, which must start from the root.
 * @returns The library, or nothing.
 */
const libraryOf = (libraries: readonly Library[], path: string): Library | null =>
  libraries
    .filter((library) => isUnderAny(resolve(path), [resolve(library.path)]))
    .sort((one, other) => other.path.length - one.path.length)[0] ?? null;

export { libraryOf };
