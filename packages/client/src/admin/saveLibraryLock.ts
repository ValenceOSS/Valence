import type { LibraryLockRequest } from '@ValenceContracts/schemas/LibraryLock';

/**
 * Locks a library behind a password or PIN, or takes its lock away.
 *
 * @param libraryId - The library.
 * @param lock - The password or PIN, or null to take the lock away, and when it locks again.
 * @returns Whether it was saved.
 */
const saveLibraryLock = async (libraryId: string, lock: LibraryLockRequest): Promise<boolean> => {
  const response = await fetch(`/api/admin/libraries/${encodeURIComponent(libraryId)}/lock`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(lock),
  }).catch(() => null);

  return response !== null && response.ok;
};

export { saveLibraryLock };
