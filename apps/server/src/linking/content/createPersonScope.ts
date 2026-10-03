import { AsyncLocalStorage } from 'node:async_hooks';
import type { LinkPerson } from '@ValenceServer/linking/LinkPerson';

type Finding = () => Promise<LinkPerson | null>;

/**
 * Who on this server a request is for, carried through everything the request does, so that what
 * is passed on to a linked server for them — a stream, a page, a picture — is asked for as them,
 * without every service between the route and the link having to be told.
 *
 * Who it is, is found only when something is passed on, and once: most requests never reach a
 * linked server, and finding out reads the session and the profile.
 *
 * @returns The scope: a way to run something for somebody yet to be found, and to ask who.
 */
const createPersonScope = () => {
  const scope = new AsyncLocalStorage<{ find: Finding; found?: Promise<LinkPerson | null> }>();

  return {
    runAs: <Result>(find: Finding, run: () => Result): Result => scope.run({ find }, run),
    current: (): Promise<LinkPerson | null> => {
      const held = scope.getStore();

      if (held === undefined) {
        return Promise.resolve(null);
      }

      held.found ??= held.find();

      return held.found;
    },
  };
};

type PersonScope = ReturnType<typeof createPersonScope>;

export type { PersonScope };

export { createPersonScope };
