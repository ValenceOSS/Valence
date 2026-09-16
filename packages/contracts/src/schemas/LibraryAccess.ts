import { z } from 'zod';

const LibraryReachSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  mayView: z.boolean(),
});

const LibraryAccessSchema = z.object({ libraries: z.array(LibraryReachSchema) });

type LibraryReach = z.infer<typeof LibraryReachSchema>;

/**
 * Whether an operator is about to take away the last library an account could reach.
 *
 * Not forbidden — an operator may have a reason, and a household is not a hostile place — but it is
 * worth saying out loud, because an account that reaches nothing looks broken rather than
 * restricted to whoever signs into it, and that is the support question nobody enjoys.
 *
 * @param libraries - What the account may reach now.
 * @param libraryId - The library about to be taken away.
 * @returns Whether that leaves them nothing.
 */
const wouldLeaveNothing = (libraries: readonly LibraryReach[], libraryId: string): boolean =>
  libraries.filter((shelf) => shelf.mayView && shelf.id !== libraryId).length === 0 &&
  libraries.some((shelf) => shelf.id === libraryId && shelf.mayView);

export type { LibraryReach };

export { LibraryReachSchema, LibraryAccessSchema, wouldLeaveNothing };
