import { describe, expect, it } from 'vitest';
import { ArrReleaseSchema } from './ArrReleaseSchema';

describe('ArrReleaseSchema', () => {
  it('reads a release as Radarr and Sonarr list one, filling in what they leave out', () => {
    const read = ArrReleaseSchema.parse({
      guid: 'abc',
      title: 'A.Film.2021.1080p.WEB-DL',
      indexerId: 3,
      indexer: 'An Indexer',
      protocol: 'usenet',
      size: 4_000_000_000,
      rejected: true,
      rejections: ['Not wanted in profile'],
      qualityWeight: 1200,
      customFormatScore: 50,
    });

    expect(read).toMatchObject({
      guid: 'abc',
      indexerId: 3,
      protocol: 'usenet',
      rejected: true,
      rejections: ['Not wanted in profile'],
    });
    expect(read.seeders).toBeUndefined();
  });
});
