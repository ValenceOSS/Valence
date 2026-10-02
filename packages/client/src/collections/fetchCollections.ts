import { readFromServer } from '@ValenceClient/query/readFromServer';
import { profileHeaders } from '@ValenceClient/profiles/currentProfile';
import {
  CollectionDetailSchema,
  CollectionListSchema,
  CollectionSchema,
} from '@ValenceContracts/schemas/Collection';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';
import type {
  Collection,
  CollectionDetail,
  CollectionSubject,
  CreateCollection,
  UpdateCollection,
} from '@ValenceContracts/schemas/Collection';
import { say } from '@ValenceI18n/say';

type CollectionListing = {
  containing?: CollectionSubject;
  withEmpty?: boolean;
};

/**
 * Sends a change to the collections and reads back whether it was taken.
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
 * Reads the collections holding something this profile may see, or only those holding one title.
 *
 * @param listing - The title they must hold, and whether to read the empty ones too, which only
 *   somebody who looks after collections is given.
 * @returns The collections, by name.
 */
const fetchCollections = async (listing: CollectionListing = {}): Promise<Collection[]> => {
  const query = new URLSearchParams();

  if (listing.containing !== undefined) {
    if ('mediaItemId' in listing.containing) {
      query.set('mediaId', listing.containing.mediaItemId);
    } else {
      query.set('seriesId', listing.containing.seriesId);
    }
  }

  if (listing.withEmpty === true) {
    query.set('withEmpty', 'true');
  }

  const asked = query.toString();

  return (
    await readFromServer(
      `/api/collections${asked === '' ? '' : `?${asked}`}`,
      CollectionListSchema,
      profileHeaders(),
    )
  ).collections;
};

/**
 * Reads a collection, less anything this profile may not see.
 *
 * @param collectionId - The collection.
 * @returns The collection and its entries in order.
 */
const fetchCollection = (collectionId: string): Promise<CollectionDetail> =>
  readFromServer(`/api/collections/${collectionId}`, CollectionDetailSchema, profileHeaders());

/**
 * Makes a collection, optionally with films and programmes in it already.
 *
 * @param input - Its name, and anything to start it with.
 * @returns The collection, or nothing where it could not be made.
 */
const createCollection = async (input: CreateCollection): Promise<Collection | null> => {
  const response = await change('/api/collections', 'POST', input);

  if (response === null || !response.ok) {
    return null;
  }

  const parsed = CollectionSchema.safeParse(JsonValueSchema.parse(await response.json()));

  return parsed.success ? parsed.data : null;
};

/**
 * Renames or describes a collection, or says whether its order matters.
 *
 * @param collectionId - The collection.
 * @param patch - What to change.
 * @returns Whether it was changed.
 */
const updateCollection = async (collectionId: string, patch: UpdateCollection): Promise<boolean> =>
  (await change(`/api/collections/${collectionId}`, 'PATCH', patch))?.ok === true;

/**
 * Deletes a collection, leaving everything that was in it where it is.
 *
 * @param collectionId - The collection.
 * @returns Whether it was deleted.
 */
const removeCollection = async (collectionId: string): Promise<boolean> =>
  (await change(`/api/collections/${collectionId}`, 'DELETE'))?.ok === true;

/**
 * Adds films and programmes to the end of a collection.
 *
 * @param collectionId - The collection.
 * @param entries - What to add, in order.
 * @returns Whether they were added.
 */
const addToCollection = async (
  collectionId: string,
  entries: readonly CollectionSubject[],
): Promise<boolean> =>
  (await change(`/api/collections/${collectionId}/entries`, 'POST', { entries }))?.ok === true;

/**
 * Moves an entry to just after another, or to the top.
 *
 * @param collectionId - The collection.
 * @param entryId - The entry being moved.
 * @param afterEntryId - The entry it goes after, or nothing for the top.
 * @returns Whether it moved.
 */
const moveInCollection = async (
  collectionId: string,
  entryId: string,
  afterEntryId: string | null,
): Promise<boolean> =>
  (await change(`/api/collections/${collectionId}/entries/${entryId}`, 'PATCH', { afterEntryId }))
    ?.ok === true;

/**
 * Takes an entry out of a collection.
 *
 * @param collectionId - The collection.
 * @param entryId - The entry.
 * @returns Whether it was taken out.
 */
const dropFromCollection = async (collectionId: string, entryId: string): Promise<boolean> =>
  (await change(`/api/collections/${collectionId}/entries/${entryId}`, 'DELETE'))?.ok === true;

/**
 * Where a collection's own artwork is read from, versioned by when the collection last changed so
 * new artwork is fetched rather than old artwork read from a cache.
 *
 * @param collection - The collection.
 * @returns The address, or nothing where it has no artwork of its own.
 */
const collectionArtworkUrl = (
  collection: Pick<Collection, 'id' | 'hasOwnArtwork' | 'updatedAt'>,
): string | null =>
  collection.hasOwnArtwork
    ? `/api/collections/${collection.id}/artwork?v=${encodeURIComponent(collection.updatedAt)}`
    : null;

/**
 * Gives a collection artwork of its own.
 *
 * @param collectionId - The collection.
 * @param picture - The picture, and what kind it is.
 * @returns What was wrong with it, or nothing where it was kept.
 */
const saveCollectionArtwork = async (
  collectionId: string,
  picture: Blob,
): Promise<string | null> => {
  const response = await fetch(`/api/collections/${collectionId}/artwork`, {
    method: 'PUT',
    credentials: 'same-origin',
    headers: { ...profileHeaders(), 'content-type': picture.type },
    body: picture,
  }).catch(() => null);

  if (response === null) {
    return say('common.thatPictureCouldNotBeSent');
  }

  if (response.ok) {
    return null;
  }

  const said = RefusalSchema.safeParse(await response.json().catch(() => null));

  return said.success ? said.data.error : say('common.thatPictureCouldNotBeUsed');
};

/**
 * Takes a collection's own artwork away, so it is drawn from what is in it again.
 *
 * @param collectionId - The collection.
 * @returns Whether it was taken away.
 */
const dropCollectionArtwork = async (collectionId: string): Promise<boolean> =>
  (await change(`/api/collections/${collectionId}/artwork`, 'DELETE'))?.ok === true;

export type { CollectionListing };

export {
  addToCollection,
  collectionArtworkUrl,
  createCollection,
  dropCollectionArtwork,
  dropFromCollection,
  fetchCollection,
  fetchCollections,
  moveInCollection,
  removeCollection,
  saveCollectionArtwork,
  updateCollection,
};
