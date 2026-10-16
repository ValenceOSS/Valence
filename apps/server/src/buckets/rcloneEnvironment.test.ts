import { describe, expect, it } from 'vitest';
import { rcloneEnvironment } from './rcloneEnvironment';
import type { StoredBucket } from '@ValenceContracts/schemas/Bucket';

const BUCKET: StoredBucket = {
  id: 'films',
  name: 'Films',
  provider: 'Cloudflare',
  endpoint: 'https://abc.r2.cloudflarestorage.com',
  region: '',
  bucket: 'media',
  prefix: '',
  accessKeyId: 'key',
  secretAccessKey: 'secret',
};

describe('rcloneEnvironment', () => {
  it('describes the bucket to rclone, secret and all, without a file', () => {
    expect(rcloneEnvironment(BUCKET)).toEqual({
      RCLONE_CONFIG_VALENCE_TYPE: 's3',
      RCLONE_CONFIG_VALENCE_PROVIDER: 'Cloudflare',
      RCLONE_CONFIG_VALENCE_ACCESS_KEY_ID: 'key',
      RCLONE_CONFIG_VALENCE_SECRET_ACCESS_KEY: 'secret',
      RCLONE_CONFIG_VALENCE_ENV_AUTH: 'false',
      RCLONE_CONFIG_VALENCE_ENDPOINT: 'https://abc.r2.cloudflarestorage.com',
    });
  });

  it('names a region only where one was given', () => {
    expect(rcloneEnvironment({ ...BUCKET, region: 'auto' })).toMatchObject({
      RCLONE_CONFIG_VALENCE_REGION: 'auto',
    });
  });
});
