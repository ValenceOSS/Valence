import { onThisServer } from '@ValenceMobile/platform/onThisServer';

/**
 * Where a picture a catalogue answer points at can be read from on this phone: a picture the
 * server keeps is named from the server's root, so it is put on the server this phone watches, and
 * one elsewhere on the web is read where it is.
 *
 * @param address - The picture's address, as the server gave it.
 * @returns An address this phone can read.
 */
const pictureOnThisServer = (address: string): string =>
  address.startsWith('/') ? onThisServer(address) : address;

export { pictureOnThisServer };
