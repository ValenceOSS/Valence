/**
 * Reads the same thing from each library and puts the answers together, failing only when every
 * library failed. One library that cannot be read leaves the others showing, but a server that
 * answers none of them, signed out or unreachable, is a failure to say rather than an empty page.
 *
 * @param libraryIds - The libraries to ask.
 * @param read - How to read one of them.
 * @returns What every library that answered holds.
 */
const readEachLibrary = async <T>(
  libraryIds: readonly string[],
  read: (libraryId: string) => Promise<readonly T[]>,
): Promise<T[]> => {
  const answers = await Promise.allSettled(libraryIds.map(read));
  const answered = answers.flatMap((answer) =>
    answer.status === 'fulfilled' ? [answer.value] : [],
  );
  const failed = answers.find((answer) => answer.status === 'rejected');

  if (failed !== undefined && answered.length === 0) {
    throw failed.reason instanceof Error ? failed.reason : new Error('No library could be read.');
  }

  return answered.flat();
};

export { readEachLibrary };
