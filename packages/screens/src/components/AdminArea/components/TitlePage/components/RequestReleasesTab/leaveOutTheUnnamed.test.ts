import { describe, expect, it } from 'vitest';
import { parseReleaseName } from '@ValenceCore/releases/parseReleaseName';
import { aRelease } from '@ValenceClient/testing/aRelease';
import { leaveOutTheUnnamed } from './leaveOutTheUnnamed';
import type { Release } from '@ValenceContracts/schemas/Indexer';
import type { Judgement } from '@ValenceContracts/schemas/QualityProfile';

/**
 * A verdict on a release, refused for the reasons given by their codes.
 */
const aJudgement = (release: Release, codes: string[]): Judgement => ({
  releaseId: release.id,
  parsed: parseReleaseName(release.title),
  quality: 0,
  score: 0,
  isRejected: codes.length > 0,
  rejections: codes.map((code) => ({ code, message: code, values: {} })),
  reasons: [],
});

describe('leaveOutTheUnnamed', () => {
  it('leaves out what is not this title, and keeps what is, refused or not', () => {
    const haruhi = aRelease('[Victor1139] The Melancholy of Haruhi Suzumiya [576p]', {
      id: 'haruhi',
    });
    const tooSmall = aRelease('The Melancholy of Haruhi Suzumiya 480p', { id: 'small' });
    const other = aRelease('A Tale of the Secret Saint S01E04 1080p', { id: 'other' });
    const { found, leftOut } = leaveOutTheUnnamed({
      releases: [haruhi, tooSmall, other],
      indexers: [],
      judgements: [
        aJudgement(haruhi, []),
        aJudgement(tooSmall, ['requests.profiles.judgeRelease.notTaken']),
        aJudgement(other, ['requests.mediaRequests.judgeForRequest.itsNameDoesNotSayItIs']),
      ],
      pickedId: 'haruhi',
    });

    expect(found.releases.map((release) => release.id)).toEqual(['haruhi', 'small']);
    expect(found.judgements.map((judgement) => judgement.releaseId)).toEqual(['haruhi', 'small']);
    expect(found.pickedId).toBe('haruhi');
    expect(leftOut).toBe(1);
  });
});
