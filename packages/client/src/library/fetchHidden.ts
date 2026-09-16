import { readFromServer } from '@ValenceClient/query/readFromServer';
import { HiddenListSchema, hiddenAddressOf } from '@ValenceContracts/schemas/Hidden';
import { profileHeaders } from '@ValenceClient/profiles/currentProfile';
import type { Hidden, HiddenKind } from '@ValenceContracts/schemas/Hidden';

type HiddenSubject = {
  kind: HiddenKind;
  subjectId: string;
};

/**
 * Everything this viewer has put out of their own sight, newest first, with enough to draw a row for
 * each and bring it back.
 *
 * Per profile rather than per account, since the whole point is that one person's clutter is another
 * person's library.
 *
 * @returns What they have hidden.
 */
const fetchHidden = async (): Promise<Hidden[]> => {
  return (await readFromServer('/api/hidden', HiddenListSchema, profileHeaders())).hidden;
};

/**
 * Hides a film, a programme or a whole library from this viewer, or brings it back. One call for
 * both directions, since the control in the interface already knows which way it is going.
 *
 * @param subject - What is being hidden or brought back.
 * @param isHidden - Whether it should be hidden.
 * @returns Whether the server agreed.
 */
const setHidden = async (subject: HiddenSubject, isHidden: boolean): Promise<boolean> => {
  const response = await fetch(hiddenAddressOf(subject), {
    method: isHidden ? 'PUT' : 'DELETE',
    credentials: 'same-origin',
    headers: profileHeaders(),
  }).catch(() => null);

  return response !== null && response.ok;
};

export type { HiddenSubject };

export { fetchHidden, setHidden };
