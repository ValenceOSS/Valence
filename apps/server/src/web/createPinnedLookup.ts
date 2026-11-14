import { lookup } from 'node:dns';
import type { LookupAddress, LookupOptions } from 'node:dns';

type LookupAnswer = (
  error: NodeJS.ErrnoException | null,
  address: string | LookupAddress[],
  family?: number,
) => void;

/**
 * Builds the name lookup a connection is made through, which keeps only the addresses allowed, so
 * the address checked is the very address connected to.
 *
 * @param isAllowed - Whether a resolved address may be connected to.
 * @param whyRefused - The error to answer with when none of a name's addresses may be.
 * @returns A lookup in the shape Node's connect asks for.
 */
const createPinnedLookup =
  (isAllowed: (address: string) => boolean, whyRefused: (addresses: readonly string[]) => Error) =>
  (hostname: string, options: LookupOptions, answer: LookupAnswer): void => {
    lookup(hostname, { ...options, all: true, verbatim: true }, (error, addresses) => {
      if (error !== null) {
        answer(error, []);

        return;
      }

      const allowed = addresses.filter(({ address }) => isAllowed(address));
      const first = allowed[0];

      if (first === undefined) {
        answer(whyRefused(addresses.map(({ address }) => address)), []);

        return;
      }

      if (options.all === true) {
        answer(null, allowed);

        return;
      }

      answer(null, first.address, first.family);
    });
  };

export { createPinnedLookup };
