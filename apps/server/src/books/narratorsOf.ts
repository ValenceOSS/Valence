import { basename } from 'node:path';

/**
 * Who reads an audiobook: whoever its tags name, and otherwise whoever its folder names in braces,
 * `Title {Narrator}`, as Audiobookshelf names a narration.
 *
 * @param tagged - The narrators its tags name.
 * @param bookPath - The book's folder or file.
 * @returns The narrators, each once.
 */
const narratorsOf = (tagged: readonly string[], bookPath: string): string[] => {
  const named = /\{([^}]+)\}/.exec(basename(bookPath))?.[1] ?? null;
  const all = tagged.length > 0 ? tagged : named === null ? [] : named.split(/\s*[,&]\s*/);

  return [...new Set(all.map((name) => name.trim()).filter((name) => name !== ''))];
};

export { narratorsOf };
