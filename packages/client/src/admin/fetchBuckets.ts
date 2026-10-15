import { readFromServer } from '@ValenceClient/query/readFromServer';
import { readRefusal } from '@ValenceClient/admin/readRefusal';
import { BucketListSchema, BucketTestSchema } from '@ValenceContracts/schemas/Bucket';
import type { BucketChange, BucketTest } from '@ValenceContracts/schemas/Bucket';
import type { Refusal } from '@ValenceClient/admin/readRefusal';
import type { z } from 'zod';
import { say } from '@ValenceI18n/say';

type BucketList = z.infer<typeof BucketListSchema>;

/**
 * Every bucket an administrator added, how each one's mount is doing, and whether this server can
 * mount buckets at all.
 */
const fetchBuckets = (): Promise<BucketList> =>
  readFromServer('/api/admin/buckets', BucketListSchema);

/**
 * Sends a change to the buckets and reads why it was refused, where it was.
 *
 * @param path - Where to send it.
 * @param method - How.
 * @param body - What to send, if anything.
 * @returns Any refusal from the server.
 */
const sendToBuckets = async (
  path: string,
  method: string,
  body?: BucketChange,
): Promise<Refusal> => {
  const response = await fetch(path, {
    method,
    credentials: 'same-origin',
    ...(body === undefined
      ? {}
      : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) }),
  }).catch(() => null);

  return response === null
    ? { message: say('common.theServerCouldNotBeReached') }
    : readRefusal(response);
};

/**
 * Adds a bucket, which the server mounts as a folder a library can be pointed at.
 *
 * @param change - The bucket, with its secret.
 * @returns Any refusal from the server.
 */
const addBucket = (change: BucketChange): Promise<Refusal> =>
  sendToBuckets('/api/admin/buckets', 'POST', change);

/**
 * Changes a bucket; an empty secret keeps the one saved.
 *
 * @param id - The bucket.
 * @param change - The bucket as it should be.
 * @returns Any refusal from the server.
 */
const changeBucket = (id: string, change: BucketChange): Promise<Refusal> =>
  sendToBuckets(`/api/admin/buckets/${id}`, 'PUT', change);

/**
 * Removes a bucket, which no library may still be reading from.
 *
 * @param id - The bucket.
 * @returns Any refusal from the server.
 */
const removeBucket = (id: string): Promise<Refusal> =>
  sendToBuckets(`/api/admin/buckets/${id}`, 'DELETE');

/**
 * Tries a bucket before it is saved, answering with the folders at the top of it or why it could
 * not be reached.
 *
 * @param change - The bucket as typed.
 * @param id - The saved bucket whose secret to use where none was typed.
 * @returns What happened.
 */
const testBucket = async (change: BucketChange, id: string | null): Promise<BucketTest> => {
  const response = await fetch(
    `/api/admin/buckets/test${id === null ? '' : `?id=${encodeURIComponent(id)}`}`,
    {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(change),
    },
  ).catch(() => null);

  if (response === null) {
    return { kind: 'refused', reason: say('common.theServerCouldNotBeReached') };
  }

  const refused = await readRefusal(response.clone());

  if (refused !== null) {
    return { kind: 'refused', reason: refused.message };
  }

  return BucketTestSchema.parse(await response.json());
};

export type { BucketList };

export { addBucket, changeBucket, fetchBuckets, removeBucket, testBucket };
