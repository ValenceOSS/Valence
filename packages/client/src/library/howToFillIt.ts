/**
 * What somebody can do about an empty screen, said the same way on every client: an admin is told
 * what to do, anybody else who to ask.
 *
 * @param missing - What is empty: there are no libraries at all, every library is empty, or the one
 *   being looked at is.
 * @param canManage - Whether whoever is looking can change the libraries themselves.
 * @returns The line to put under the title.
 */
const howToFillIt = (
  missing: 'no libraries' | 'every library' | 'one library',
  canManage: boolean,
): string => {
  if (missing === 'no libraries') {
    return canManage ? 'Add one to get started.' : 'Ask the server admin to add one.';
  }

  if (missing === 'every library') {
    return canManage
      ? 'Scan your libraries, or add files to them.'
      : 'Ask the server admin to scan your libraries.';
  }

  return canManage ? 'Scan it, or add files to its folder.' : 'Ask the server admin to scan it.';
};

export { howToFillIt };
