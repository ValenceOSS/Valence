import { readStackPart } from '@ValenceServer/library/naming/readStackPart';
import { pathParts } from './pathParts';

type Stack = { name: string; parts: string[] };

/**
 * The films kept as several files among a library's files, as Jellyfin stacks them: files in one
 * folder that share a name and a part word and are numbered from the first part on without a gap,
 * such as "Film (1999) - cd1.mkv" and "Film (1999) - cd2.mkv". A lone part, or parts with one
 * missing between them, are left as they are rather than joined into a film with a hole in it.
 *
 * @param paths - Every file in the library.
 * @returns Each film kept as several files, by the path of its first part, with what it is called
 *   and its parts in order.
 */
const stacksIn = (paths: readonly string[]): Map<string, Stack> => {
  const groups = new Map<
    string,
    { name: string; parts: Map<number, string>; isClaimedTwice: boolean }
  >();

  for (const path of paths) {
    const { folder, fileName } = pathParts(path);
    const part = readStackPart(fileName);

    if (part === null) {
      continue;
    }

    const key = [folder, part.name.toLowerCase(), part.kind].join('\u0000');
    const group = groups.get(key) ?? {
      name: part.name,
      parts: new Map<number, string>(),
      isClaimedTwice: false,
    };

    group.isClaimedTwice ||= group.parts.has(part.number);
    group.parts.set(part.number, path);
    groups.set(key, group);
  }

  const stacks = new Map<string, Stack>();

  for (const { name, parts, isClaimedTwice } of groups.values()) {
    const ordered = Array.from({ length: parts.size }, (_, at) => parts.get(at + 1)).flatMap(
      (path) => (path === undefined ? [] : [path]),
    );
    const first = ordered[0];

    if (
      !isClaimedTwice &&
      ordered.length > 1 &&
      ordered.length === parts.size &&
      first !== undefined
    ) {
      stacks.set(first, { name, parts: ordered });
    }
  }

  return stacks;
};

export type { Stack };

export { stacksIn };
