import { describe, expect, it } from 'vitest';
import { BucketChangeSchema, BucketListSchema } from './Bucket';

describe('BucketChangeSchema', () => {
  it('reads a change that leaves the secret out, keeping the one saved', () => {
    expect(
      BucketChangeSchema.parse({
        name: 'Films',
        provider: 'Other',
        endpoint: 'https://s3.eu-central-003.backblazeb2.com',
        region: '',
        bucket: 'media',
        prefix: '',
        accessKeyId: 'key',
      }).secretAccessKey,
    ).toBe('');
  });

  it('refuses a bucket with no name', () => {
    expect(
      BucketChangeSchema.safeParse({
        name: ' ',
        provider: 'AWS',
        endpoint: '',
        region: '',
        bucket: 'media',
        prefix: '',
        accessKeyId: 'key',
      }).success,
    ).toBe(false);
  });
});

describe('BucketListSchema', () => {
  it('reads why a mount failed', () => {
    expect(
      BucketListSchema.parse({
        canMount: true,
        buckets: [
          {
            id: 'films',
            name: 'Films',
            provider: 'AWS',
            endpoint: '',
            region: '',
            bucket: 'media',
            prefix: '',
            accessKeyId: 'key',
            path: '/buckets/films',
            status: { state: 'failed', reason: 'AccessDenied' },
          },
        ],
      }).buckets[0]?.status,
    ).toEqual({ state: 'failed', reason: 'AccessDenied' });
  });
});
