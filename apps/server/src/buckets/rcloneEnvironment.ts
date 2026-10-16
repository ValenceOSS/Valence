import type { StoredBucket } from '@ValenceContracts/schemas/Bucket';

const REMOTE = 'VALENCE';

/**
 * Describes a bucket to rclone through its environment rather than a config file or its arguments,
 * so the secret is never written to disk nor shown to anybody listing the machine's processes.
 *
 * @param bucket - The bucket.
 * @returns The variables rclone reads it from.
 */
const rcloneEnvironment = (bucket: StoredBucket): Record<string, string> => ({
  [`RCLONE_CONFIG_${REMOTE}_TYPE`]: 's3',
  [`RCLONE_CONFIG_${REMOTE}_PROVIDER`]: bucket.provider,
  [`RCLONE_CONFIG_${REMOTE}_ACCESS_KEY_ID`]: bucket.accessKeyId,
  [`RCLONE_CONFIG_${REMOTE}_SECRET_ACCESS_KEY`]: bucket.secretAccessKey,
  [`RCLONE_CONFIG_${REMOTE}_ENV_AUTH`]: 'false',
  ...(bucket.endpoint === '' ? {} : { [`RCLONE_CONFIG_${REMOTE}_ENDPOINT`]: bucket.endpoint }),
  ...(bucket.region === '' ? {} : { [`RCLONE_CONFIG_${REMOTE}_REGION`]: bucket.region }),
});

export { REMOTE, rcloneEnvironment };
