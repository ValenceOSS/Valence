import { readFromServer } from '@ValenceClient/query/readFromServer';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import {
  TitleEditOutcomeSchema,
  TitleHistorySchema,
  TitleMetadataSchema,
} from '@ValenceContracts/schemas/TitleEdit';
import type {
  TitleEditOutcome,
  TitleEditRequest,
  TitleHistory,
  TitleMetadata,
} from '@ValenceContracts/schemas/TitleEdit';
import { say } from '@ValenceI18n/say';

type TitleScope = 'title' | 'season' | 'episode';

type TitleEditAnswer =
  | { kind: 'saved'; outcome: TitleEditOutcome }
  | { kind: 'refused'; reason: string };

/**
 * Builds the address of a title's metadata, as reached through one of its files.
 *
 * @param mediaId - A file of the title.
 * @param scope - The film or programme, the file's season, or the file's episode.
 * @param rest - What follows, such as the history.
 * @returns The address.
 */
const addressOf = (mediaId: string, scope: TitleScope, rest = ''): string =>
  `/api/media/${mediaId}/metadata${rest}?${new URLSearchParams({ scope }).toString()}`;

/**
 * Sends a change to a title's metadata, and reads the title as it stands afterwards.
 *
 * @param path - Where the change goes.
 * @param method - How it is sent.
 * @param body - The change, where there is one.
 * @returns The change and the title, or why it was refused.
 */
const sendChange = async (
  path: string,
  method: 'PATCH' | 'POST',
  body?: TitleEditRequest,
): Promise<TitleEditAnswer> => {
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  }).catch(() => null);

  if (response === null) {
    return { kind: 'refused', reason: say('common.theServerCouldNotBeReached') };
  }

  const answer = await response.json().catch(() => null);
  const saved = TitleEditOutcomeSchema.safeParse(answer);

  if (response.ok && saved.success) {
    return { kind: 'saved', outcome: saved.data };
  }

  const refused = RefusalSchema.safeParse(answer);

  return {
    kind: 'refused',
    reason: refused.success
      ? refused.data.error
      : say('client.admin.fetchCorrections.thatCouldNotBeChanged'),
  };
};

/**
 * Reads every field of a title, each with where its value came from.
 *
 * @param mediaId - A file of the title.
 * @param scope - The film or programme, the file's season, or the file's episode.
 * @returns The title's metadata.
 */
const fetchTitleMetadata = (mediaId: string, scope: TitleScope): Promise<TitleMetadata> =>
  readFromServer(addressOf(mediaId, scope), TitleMetadataSchema);

/**
 * Sets, locks or puts back fields of a title.
 *
 * @param mediaId - A file of the title.
 * @param scope - The film or programme, the file's season, or the file's episode.
 * @param request - What to change.
 * @returns The change and the title as it now stands, or why it was refused.
 */
const editTitleMetadata = (
  mediaId: string,
  scope: TitleScope,
  request: TitleEditRequest,
): Promise<TitleEditAnswer> => sendChange(addressOf(mediaId, scope), 'PATCH', request);

/**
 * Reads the changes made to a title, newest first.
 *
 * @param mediaId - A file of the title.
 * @param scope - The film or programme, the file's season, or the file's episode.
 * @returns The changes.
 */
const fetchTitleHistory = (mediaId: string, scope: TitleScope): Promise<TitleHistory> =>
  readFromServer(addressOf(mediaId, scope, '/history'), TitleHistorySchema);

/**
 * Undoes a change to a title.
 *
 * @param mediaId - A file of the title.
 * @param scope - The film or programme, the file's season, or the file's episode.
 * @param changeSetId - The change.
 * @returns The title as it now stands, or why it could not be undone.
 */
const undoTitleChange = (
  mediaId: string,
  scope: TitleScope,
  changeSetId: string,
): Promise<TitleEditAnswer> =>
  sendChange(addressOf(mediaId, scope, `/history/${changeSetId}/undo`), 'POST');

export type { TitleScope, TitleEditAnswer };

export { fetchTitleMetadata, editTitleMetadata, fetchTitleHistory, undoTitleChange };
