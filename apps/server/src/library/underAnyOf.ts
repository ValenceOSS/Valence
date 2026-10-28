import { sep } from 'node:path';

/**
 * Builds a check for whether a path is one of a set of roots or lies inside one, the same answer
 * `isUnderAny` gives, for checking many paths against many roots. The roots are held in a set and
 * each path's own folders looked up in it, so a scan of fifty thousand files against a thousand
 * folders left out is fifty thousand short lookups rather than fifty million comparisons.
 *
 * @param roots - The folders and files to check against.
 * @returns Whether a path is one of them or inside one.
 */
const underAnyOf = (roots: readonly string[]): ((path: string) => boolean) => {
  const held = new Set(roots);

  return (path) => {
    if (held.has(path)) {
      return true;
    }

    for (let at = path.indexOf(sep); at !== -1; at = path.indexOf(sep, at + 1)) {
      if (held.has(path.slice(0, at))) {
        return true;
      }
    }

    return false;
  };
};

export { underAnyOf };
