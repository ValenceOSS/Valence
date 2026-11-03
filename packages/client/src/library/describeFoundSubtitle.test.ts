import { describe, expect, it } from 'vitest';
import { describeFoundSubtitle } from './describeFoundSubtitle';
import type { FoundSubtitle } from '@ValenceContracts/schemas/SubtitleFinding';

const FOUND: FoundSubtitle = {
  source: 'opensubtitles',
  id: '1',
  name: 'Arrival.2016.1080p.BluRay.x264-SPARKS',
  language: 'en',
  isExactMatch: true,
  isHearingImpaired: false,
  isMachineTranslated: false,
  frameRate: null,
  downloads: 120,
  score: 92,
  reasons: ['madeForThisFile', 'sameRelease'],
};

describe('describeFoundSubtitle', () => {
  it('says how well it matches, why, and which site has it', () => {
    expect(describeFoundSubtitle(FOUND)).toBe(
      '92% match · Made for this file · Same release · OpenSubtitles',
    );
  });

  it('says where it describes sounds or was machine translated', () => {
    expect(
      describeFoundSubtitle({
        ...FOUND,
        source: 'subdl',
        score: 40,
        reasons: ['differentFrameRate'],
        isHearingImpaired: true,
        isMachineTranslated: true,
      }),
    ).toBe('40% match · Different frame rate, will drift · SDH · Machine translated · SubDL');
  });
});
