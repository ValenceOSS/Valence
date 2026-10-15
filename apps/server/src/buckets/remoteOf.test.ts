import { describe, expect, it } from 'vitest';
import { remoteOf } from './remoteOf';
import type { StoredBucket } from '@ValenceContracts/schemas/Bucket';

const BUCKET: StoredBucket = {
  id: 'films',
  name: 'Films',
  provider: 'AWS',
  endpoint: '',
  region: 'eu-west-2',
  bucket: 'media',
  prefix: '',
  accessKeyId: 'key',
  secretAccessKey: 'secret',
};

describe('remoteOf', () => {
  it('addresses the whole bucket where no folder was given', () => {
    expect(remoteOf(BUCKET)).toBe('valence:media');
  });

  it('addresses the folder inside it, however its slashes were typed', () => {
    expect(remoteOf({ ...BUCKET, prefix: '/library/films/' })).toBe('valence:media/library/films');
  });
});
