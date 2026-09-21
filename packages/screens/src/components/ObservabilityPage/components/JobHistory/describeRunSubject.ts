import type { Library } from '@ValenceContracts/schemas/Library';

type RunSubject = { name: string; library: Library | null };

const IDENTIFIER = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Says what a job that was not about anything in particular worked on, from what kind of job it was:
 * a library job that took no library worked on all of them, and a server job on the server.
 *
 * @param kind - The kind of job.
 * @returns What it worked on.
 */
const describeScope = (kind: string): string => {
  if (kind.startsWith('library.')) {
    return 'Every library';
  }

  if (kind.startsWith('server.')) {
    return 'This server';
  }

  if (kind.startsWith('requests.')) {
    return 'Requests';
  }

  return kind.startsWith('catalogue.') ? 'The catalogue' : 'Everything';
};

/**
 * Names what a job run was about, turning the library identifier the server records into the
 * library's own name. A run that was about nothing in particular is said to be about what its kind of
 * job works on, and one about a library that has since been removed says so, rather than either being
 * left blank or shown as a code.
 *
 * @param subject - The subject the run was recorded with, or null where it had none.
 * @param libraries - The libraries a subject can name.
 * @param kind - The kind of job the run was.
 * @returns The name to show, and the library it stands for where it names one.
 */
const describeRunSubject = (
  subject: string | null,
  libraries: readonly Library[],
  kind: string,
): RunSubject => {
  if (subject === null) {
    return { name: describeScope(kind), library: null };
  }

  const library = libraries.find((candidate) => candidate.id === subject) ?? null;

  if (library === null && IDENTIFIER.test(subject)) {
    return { name: 'A library that has been removed', library: null };
  }

  return { name: library?.name ?? subject, library };
};

export { describeRunSubject };
export type { RunSubject };
