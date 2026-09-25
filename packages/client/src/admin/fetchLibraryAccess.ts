import { readFromServer } from '@ValenceClient/query/readFromServer';
import {
  ExceptionHolderListSchema,
  LibraryAccessSchema,
} from '@ValenceContracts/schemas/LibraryAccess';
import { readRefusal } from '@ValenceClient/admin/readRefusal';
import type { ExceptionHolder, LibraryReach } from '@ValenceContracts/schemas/LibraryAccess';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import { say } from '@ValenceI18n/say';

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
    ? { message: say('client.serverProblem.unreachable') }
    : readRefusal(response);
};

/**
 * Limits an account to content at or below an age in one library, or lifts that limit where no age
 * is given.
 *
 * Set per library because a household wants different answers in different places — a children's
 * library with no limit at all, and the general one capped.
 *
 * @param userId - The account.
 * @param libraryId - The library the limit applies in.
 * @param ceiling - The age allowed and whether unrated things are, or null to lift it.
 * @returns Any refusal from the server.
 */
const setCeiling = async (
  userId: string,
  libraryId: string,
  ceiling: { maximumAge: number; allowsUnrated: boolean } | null,
): Promise<Refusal> => {
  const response = await fetch(
    `/api/admin/accounts/${userId}/libraries/${libraryId}/ceiling`,
    ceiling === null
      ? { method: 'DELETE', credentials: 'same-origin' }
      : {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify(ceiling),
        },
  ).catch(() => null);

  return response === null
    ? { message: say('client.serverProblem.unreachable') }
    : readRefusal(response);
};

/**
 * Forgets an exception, leaving the ceiling to decide about that thing again.
 *
 * @param userId - The account.
 * @param exception - Which one.
 * @returns Any refusal from the server.
 */
const clearException = async (
  userId: string,
  exception: { kind: 'item' | 'series'; subjectId: string },
): Promise<Refusal> => {
  const response = await fetch(
    `/api/admin/accounts/${userId}/exceptions/${exception.kind}/${exception.subjectId}`,
    { method: 'DELETE', credentials: 'same-origin' },
  ).catch(() => null);

  return response === null
    ? { message: say('client.serverProblem.unreachable') }
    : readRefusal(response);
};

/**
 * Which accounts already have one particular thing allowed or denied, so that deciding about it
 * again shows what was decided before rather than asking blind.
 *
 * @param subject - The item or programme.
 * @returns The accounts carrying an exception on it.
 */
const fetchExceptionsOn = async (subject: {
  kind: 'item' | 'series';
  subjectId: string;
}): Promise<ExceptionHolder[]> => {
  return (
    await readFromServer(
      `/api/admin/exceptions/${subject.kind}/${subject.subjectId}`,
      ExceptionHolderListSchema,
    )
  ).accounts;
};

/**
 * Allows or denies one thing for one account, whatever that account's ceiling says.
 *
 * @param userId - The account.
 * @param subject - The item or programme.
 * @param effect - Whether to allow it or deny it.
 * @returns Any refusal from the server.
 */
const setException = async (
  userId: string,
  subject: { kind: 'item' | 'series'; subjectId: string },
  effect: 'allow' | 'deny',
): Promise<Refusal> => {
  const response = await fetch(`/api/admin/accounts/${userId}/exceptions`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ ...subject, effect }),
  }).catch(() => null);

  return response === null
    ? { message: say('client.serverProblem.unreachable') }
    : readRefusal(response);
};

export {
  fetchLibraryAccess,
  setLibraryAccess,
  setCeiling,
  fetchExceptionsOn,
  setException,
  clearException,
};
