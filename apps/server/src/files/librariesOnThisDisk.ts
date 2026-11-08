import type { Library } from '@ValenceContracts/schemas/Library';

/**
 * Keeps the libraries whose files are on this server's disk, leaving out those a linked server
 * shares.
 *
 * @param libraries - The libraries there are.
 * @returns Those with files here.
 */
const librariesOnThisDisk = (libraries: readonly Library[]): Library[] =>
  libraries.filter((library) => (library.linkedServerId ?? null) === null);

export { librariesOnThisDisk };
