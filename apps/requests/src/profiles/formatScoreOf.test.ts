import { describe, expect, it } from 'vitest';
import { parseReleaseName } from '@ValenceRequests/releases/parseReleaseName';
import { formatScoreOf } from './formatScoreOf';
import type { CustomFormat } from '@ValenceContracts/schemas/QualityProfile';

const TITLE = 'Dune.2021.2160p.WEB-DL.DV.HDR10.DDP5.1.Atmos.H.265-FLUX';

const HDR: CustomFormat = {
  name: 'HDR',
  score: 500,
  conditions: [
    { kind: 'hdr', value: 'hdr10', isNegated: false, isRequired: false },
    { kind: 'hdr', value: 'dolbyVision', isNegated: false, isRequired: false },
  ],
};

const X265_HD: CustomFormat = {
  name: 'x265 (HD)',
  score: -10_000,
  conditions: [
    { kind: 'codec', value: 'h265', isNegated: false, isRequired: true },
    { kind: 'resolution', value: '2160p', isNegated: true, isRequired: true },
  ],
};

const ATMOS: CustomFormat = {
  name: 'Atmos',
  score: 50,
  conditions: [{ kind: 'words', value: 'Atmos', isNegated: false, isRequired: true }],
};

/**
 * Scores a release of the name given.
 */
const scored = (title: string, formats: CustomFormat[]) =>
  formatScoreOf({ title, sizeBytes: null }, parseReleaseName(title), formats);

describe('formatScoreOf', () => {
  it('adds the scores of every format a release matches', () => {
    const { score, matched } = scored(TITLE, [HDR, X265_HD, ATMOS]);

    expect(score).toBe(550);
    expect(matched.map((format) => format.name)).toEqual(['HDR', 'Atmos']);
  });

  it('matches a format only where every condition it requires is met', () => {
    expect(scored('Dune.2021.1080p.WEB-DL.H.265-GRP', [X265_HD]).score).toBe(-10_000);
    expect(scored('Dune.2021.1080p.WEB-DL.H.264-GRP', [X265_HD]).score).toBe(0);
  });

  it('scores nothing where there are no formats', () => {
    expect(scored(TITLE, []).score).toBe(0);
  });
});
