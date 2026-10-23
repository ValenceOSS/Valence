const DISC_STREAM = /^(?<disc>.+)\/BDMV\/STREAM\/[^/]+$/iu;

/**
 * The folder a Blu-ray rip was copied into, for a stream inside its `BDMV/STREAM` folder, since a
 * disc copied whole is one title however many streams it holds, as Jellyfin reads it.
 *
 * @param path - A file in the library.
 * @returns The folder holding `BDMV`, or null where the file is not one of a disc's streams.
 */
const discFolderOf = (path: string): string | null => DISC_STREAM.exec(path)?.groups?.disc ?? null;

export { discFolderOf };
