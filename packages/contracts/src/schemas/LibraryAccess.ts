import { z } from 'zod';

const LibraryReachSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  mayView: z.boolean(),
  maximumAge: z.number().int().min(0).max(21).nullable(),
  allowsUnrated: z.boolean(),
});

const AgeExceptionSchema = z.object({
  kind: z.enum(['item', 'series']),
  subjectId: z.string().uuid(),
  title: z.string(),
  effect: z.enum(['allow', 'deny']),
});

const AgeExceptionListSchema = z.object({ exceptions: z.array(AgeExceptionSchema) });

const ExceptionHolderSchema = z.object({
  accountId: z.string(),
  effect: z.enum(['allow', 'deny']),
});

const ExceptionHolderListSchema = z.object({ accounts: z.array(ExceptionHolderSchema) });

const SetCeilingSchema = z.object({
  maximumAge: z.number().int().min(0).max(21),
  allowsUnrated: z.boolean().default(false),
});

const SetExceptionSchema = z.object({
  kind: z.enum(['item', 'series']),
  subjectId: z.string().uuid(),
  effect: z.enum(['allow', 'deny']),
});

const LibraryAccessSchema = z.object({ libraries: z.array(LibraryReachSchema) });

type LibraryReach = z.infer<typeof LibraryReachSchema>;
type AgeException = z.infer<typeof AgeExceptionSchema>;
type ExceptionHolder = z.infer<typeof ExceptionHolderSchema>;

/**
 * How a ceiling reads on the page, so that nobody has to work out what a number means.
 *
 * Zero is a real answer and a strict one — only what everybody may watch — so it is written out
 * rather than left to look like nothing set.
 *
 * @param maximumAge - The age allowed, or nothing where no ceiling is set.
 * @returns What to show.
 */
const describeCeiling = (maximumAge: number | null): string =>
  maximumAge === null
    ? 'No ceiling'
    : maximumAge === 0
      ? 'Suitable for all'
      : `Up to ${String(maximumAge)}`;

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

export type { AgeException, ExceptionHolder, LibraryReach };

export {
  LibraryReachSchema,
  LibraryAccessSchema,
  AgeExceptionSchema,
  AgeExceptionListSchema,
  ExceptionHolderListSchema,
  SetCeilingSchema,
  SetExceptionSchema,
  describeCeiling,
  wouldLeaveNothing,
};
