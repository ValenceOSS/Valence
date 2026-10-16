import { REMOTE } from './rcloneEnvironment';
import type { StoredBucket } from '@ValenceContracts/schemas/Bucket';

/**
 * Names the part of a bucket a library reads from, as rclone addresses it: the bucket, and the
 * folder inside it where one was given.
 *
 * @param bucket - The bucket.
 * @returns The rclone remote path.
 */
const remoteOf = (bucket: StoredBucket): string => {
  const prefix = bucket.prefix.replace(/^\/+|\/+$/gu, '');

  return `${REMOTE.toLowerCase()}:${bucket.bucket}${prefix === '' ? '' : `/${prefix}`}`;
};

export { remoteOf };
