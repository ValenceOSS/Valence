import { and, eq, isNull } from 'drizzle-orm';
import type { SQL } from 'drizzle-orm';
import { library } from '#dialect/Schema';

/**
 * Whether a library holds files on this server: one of its own, rather than one kept from a linked
 * server or the hidden one films played straight from a source are kept in. What is held here is
 * what a request counts as already had.
 *
 * @returns The condition, over `library`.
 */
const heldOnThisServer = (): SQL | undefined =>
  and(isNull(library.linkedServerId), eq(library.isStreamed, false));

export { heldOnThisServer };
