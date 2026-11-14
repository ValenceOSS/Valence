import type { Library } from '@ValenceContracts/schemas/Library';

/**
 * A library as somebody who may not change libraries is shown it, without the folders it reads
 * from and writes to on the machine, or the settings that go with them. Its folder reads as the
 * root, so a client that expects one still has something to read.
 *
 * @param entry - The library.
 * @returns It, without where it is on the disk.
 */
const withoutHostFolders = (entry: Library): Library => {
  const { writesNfo: _writesNfo, ...kept } = entry;

  return { ...kept, path: '/', requestPath: null, requestProfileId: null, filesAtOnce: null };
};

export { withoutHostFolders };
