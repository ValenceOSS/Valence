import { readFromServer } from '@ValenceClient/query/readFromServer';
import { LibraryAccessSchema } from '@ValenceContracts/schemas/LibraryAccess';
import { readRefusal } from '@ValenceClient/admin/readRefusal';
import type { LibraryReach } from '@ValenceContracts/schemas/LibraryAccess';
import type { Refusal } from '@ValenceClient/admin/readRefusal';

/**
 * Every library on this server, and whether this account is allowed to see it.
 *
 * Answers for all of them rather than only the ones it may see, because this is the list an operator
 * is deciding from and a library missing from it cannot be given back.
 *
 * @param userId - The account.
 * @returns Every library, with whether that account reaches it.
 */
const fetchLibraryAccess = async (userId: string): Promise<LibraryReach[]> => {
  return (await readFromServer(`/api/admin/accounts/${userId}/libraries`, LibraryAccessSchema))
    .libraries;
};

/**
 * Decides whether an account may see a library. One call for both directions, since the control in
 * the interface already knows which way it is going.
 *
 * @param userId - The account.
 * @param libraryId - The library.
 * @param mayView - Whether they should reach it.
 * @returns Any refusal from the server.
 */
const setLibraryAccess = async (
  userId: string,
  libraryId: string,
  mayView: boolean,
): Promise<Refusal> => {
  const response = await fetch(`/api/admin/accounts/${userId}/libraries/${libraryId}`, {
    method: mayView ? 'PUT' : 'DELETE',
    credentials: 'same-origin',
  }).catch(() => null);

  return response === null
    ? { message: 'The server could not be reached.' }
    : readRefusal(response);
};

export { fetchLibraryAccess, setLibraryAccess };
