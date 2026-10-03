import { LINKED_SCHEME } from './LINKED_SCHEME';

const SHAPE = /^linked:\/\/([0-9a-fA-F-]{36})(\/api\/[^\s]*)$/u;

/**
 * Reads which linked server something comes from and the route on it, from where it is kept.
 *
 * @param address - A path or artwork address.
 * @returns The server and the route, or nothing where it is this server's own.
 */
const readLinkedAddress = (address: string): { serverId: string; route: string } | null => {
  if (!address.startsWith(LINKED_SCHEME)) {
    return null;
  }

  const found = SHAPE.exec(address);

  return found?.[1] === undefined || found[2] === undefined
    ? null
    : { serverId: found[1], route: found[2] };
};

export { readLinkedAddress };
