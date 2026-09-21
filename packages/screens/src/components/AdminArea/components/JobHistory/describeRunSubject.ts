import type { Library } from '@ValenceContracts/schemas/Library';

type RunSubject = { name: string; library: Library | null };

/**
 * Names what a job run was about, turning the library identifier the server records into the
 * library's own name, and leaving any other subject as it was written.
 *
 * @param subject - The subject the run was recorded with, or null where it had none.
 * @param libraries - The libraries a subject can name.
 * @returns The name to show, and the library it stands for where it names one.
 */
const describeRunSubject = (subject: string | null, libraries: readonly Library[]): RunSubject => {
  if (subject === null) {
    return { name: '—', library: null };
  }

  const library = libraries.find((candidate) => candidate.id === subject) ?? null;

  return { name: library?.name ?? subject, library };
};

export { describeRunSubject };
export type { RunSubject };
