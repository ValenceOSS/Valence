import type { LinkedAsker } from './createLinkedAsker';

/**
 * Reads a picture or a file a linked server shares, whole, from its linked address.
 *
 * @param asker - How a linked server is asked.
 * @param address - The linked address.
 * @returns The bytes, or nothing where there are none or the server could not be reached.
 */
const readLinkedBytes = async (asker: LinkedAsker, address: string): Promise<Uint8Array | null> => {
  const answered = await asker.askAt(address);

  return answered?.ok === true ? new Uint8Array(await answered.arrayBuffer()) : null;
};

export { readLinkedBytes };
