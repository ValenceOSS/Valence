import { describe, expect, it } from 'vitest';
import { ArrReleaseSchema } from '@ValenceRequests/arrApps/schemas/ArrReleaseSchema';
import { releaseFromArr } from './releaseFromArr';

const APP = '3f0e8a52-7b1c-4d2e-9f3a-5b6c7d8e9f01';

describe('releaseFromArr', () => {
  it('carries the app’s indexer and guid in its id, and the app’s own judgement', () => {
    const { release, judgement } = releaseFromArr(
      ArrReleaseSchema.parse({
        guid: 'abc',
        title: 'A.Film.2021.1080p.WEB-DL.x264-GRP',
        indexerId: 3,
        indexer: 'An Indexer',
        protocol: 'torrent',
        seeders: 12,
        publishDate: '2026-10-01T10:00:00Z',
        rejected: true,
        rejections: ['Not wanted in profile'],
        qualityWeight: 1200,
        customFormatScore: 50,
      }),
      APP,
    );

    expect(release).toMatchObject({
      id: '3:abc',
      indexerId: APP,
      indexerName: 'An Indexer',
      seeders: 12,
      publishedAt: '2026-10-01T10:00:00.000Z',
    });
    expect(judgement).toMatchObject({
      releaseId: '3:abc',
      quality: 1200,
      score: 50,
      isRejected: true,
    });
    expect(judgement.rejections.map((said) => said.message)).toEqual(['Not wanted in profile']);
  });
});
