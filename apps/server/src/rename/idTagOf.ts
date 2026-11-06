const ID_TAG = /\[(?:tmdbid|imdbid|tvdbid)-[^\]]+\]|\{(?:tmdb|imdb|tvdb)-[^}]+\}/iu;

/**
 * The catalogue number a folder's name carries for media servers to match it by, such as
 * `[tmdbid-603]`, so a folder renamed to the library's pattern keeps it.
 *
 * @param name - The folder's name.
 * @returns The number as it is written, or null where it carries none.
 */
const idTagOf = (name: string): string | null => ID_TAG.exec(name)?.[0] ?? null;

export { idTagOf };
