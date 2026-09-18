import { readFromServer } from '@ValenceClient/query/readFromServer';
import { profileHeaders } from '@ValenceClient/profiles/currentProfile';
import {
  PlaylistDetailSchema,
  PlaylistListSchema,
  PlaylistSummarySchema,
} from '@ValenceContracts/schemas/Playlist';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import type {
  CreatePlaylist,
  PlaylistDetail,
  PlaylistSummary,
  UpdatePlaylist,
} from '@ValenceContracts/schemas/Playlist';

/**
 * Sends a change to the playlists and reads back whether it was taken.
 *
 * @param path - Where the change goes.
 * @param method - How it is sent.
 * @param body - What it says, where it says anything.
 * @returns The answer, or nothing where the server could not be reached.
 */
const change = (path: string, method: string, body?: object): Promise<Response | null> =>
  fetch(path, {
    method,
    credentials: 'same-origin',
    headers: {
      ...profileHeaders(),
      ...(body === undefined ? {} : { 'content-type': 'application/json' }),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  }).catch(() => null);

/**
 * Reads this profile's playlists and the ones others have shared.
 *
 * @returns The playlists, most recently changed first.
 */
const fetchPlaylists = async (): Promise<PlaylistSummary[]> =>
  (await readFromServer('/api/playlists', PlaylistListSchema, profileHeaders())).playlists;

/**
 * Reads a playlist, less anything this profile may not see.
 *
 * @param playlistId - The playlist.
 * @returns The playlist and its entries in order.
 */
const fetchPlaylist = (playlistId: string): Promise<PlaylistDetail> =>
  readFromServer(`/api/playlists/${playlistId}`, PlaylistDetailSchema, profileHeaders());

/**
 * Makes a playlist, optionally with things in it already.
 *
 * @param input - Its name, and anything to start it with.
 * @returns The playlist, or nothing where it could not be made.
 */
const createPlaylist = async (input: CreatePlaylist): Promise<PlaylistSummary | null> => {
  const response = await change('/api/playlists', 'POST', input);

  if (response === null || !response.ok) {
    return null;
  }

  const parsed = PlaylistSummarySchema.safeParse(JsonValueSchema.parse(await response.json()));

  return parsed.success ? parsed.data : null;
};

/**
 * Renames, describes, shares or orders one of this profile's playlists.
 *
 * @param playlistId - The playlist.
 * @param patch - What to change.
 * @returns Whether it was changed.
 */
const updatePlaylist = async (playlistId: string, patch: UpdatePlaylist): Promise<boolean> =>
  (await change(`/api/playlists/${playlistId}`, 'PATCH', patch))?.ok === true;

/**
 * Deletes one of this profile's playlists.
 *
 * @param playlistId - The playlist.
 * @returns Whether it was deleted.
 */
const removePlaylist = async (playlistId: string): Promise<boolean> =>
  (await change(`/api/playlists/${playlistId}`, 'DELETE'))?.ok === true;

/**
 * Adds to the end of one of this profile's playlists.
 *
 * @param playlistId - The playlist.
 * @param mediaItemIds - What to add, in order.
 * @returns Whether they were added.
 */
const addToPlaylist = async (
  playlistId: string,
  mediaItemIds: readonly string[],
): Promise<boolean> =>
  (await change(`/api/playlists/${playlistId}/entries`, 'POST', { mediaItemIds }))?.ok === true;

/**
 * Moves an entry to just after another, or to the top.
 *
 * @param playlistId - The playlist.
 * @param entryId - The entry being moved.
 * @param afterEntryId - The entry it goes after, or nothing for the top.
 * @returns Whether it moved.
 */
const moveInPlaylist = async (
  playlistId: string,
  entryId: string,
  afterEntryId: string | null,
): Promise<boolean> =>
  (await change(`/api/playlists/${playlistId}/entries/${entryId}`, 'PATCH', { afterEntryId }))
    ?.ok === true;

/**
 * Takes an entry out of one of this profile's playlists.
 *
 * @param playlistId - The playlist.
 * @param entryId - The entry.
 * @returns Whether it was taken out.
 */
const dropFromPlaylist = async (playlistId: string, entryId: string): Promise<boolean> =>
  (await change(`/api/playlists/${playlistId}/entries/${entryId}`, 'DELETE'))?.ok === true;

export {
  addToPlaylist,
  createPlaylist,
  dropFromPlaylist,
  fetchPlaylist,
  fetchPlaylists,
  moveInPlaylist,
  removePlaylist,
  updatePlaylist,
};
