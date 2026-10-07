import type { About } from '@ValenceContracts/schemas/About';

/**
 * How long what a server said about itself is kept before it is asked again: for good once it has
 * named its build, since that cannot change under a process that is already up, and not at all
 * where it kept its build back from somebody not signed in, so the build appears once somebody
 * signs in.
 *
 * @param about - What the server said, where it has said anything.
 * @returns How long to keep it, in milliseconds.
 */
const aboutKeptFor = (about: About | undefined): number =>
  about?.version === undefined && about?.commit === undefined ? 0 : Infinity;

export { aboutKeptFor };
