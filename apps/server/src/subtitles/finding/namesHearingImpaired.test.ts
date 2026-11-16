import { describe, expect, it } from 'vitest';
import { namesHearingImpaired } from './namesHearingImpaired';

describe('namesHearingImpaired', () => {
  it('reads HI, SDH and CC where uploaders put them', () => {
    expect(namesHearingImpaired('A.Film.2020.720p.WEBRip.x264-GalaxyRG-HI')).toBe(true);
    expect(namesHearingImpaired('A.Film.2020.WEBRip.Netflix.en[cc]')).toBe(true);
    expect(namesHearingImpaired('Show.S01E02.SDH.1080p.WEB')).toBe(true);
  });

  it('leaves one that says none of them, and never reads the title', () => {
    expect(namesHearingImpaired('A.Film.2020.1080p.WEB.H264-EGEN')).toBe(false);
    expect(namesHearingImpaired('Hi.Mom.2021.1080p.WEB.H264-GROUP')).toBe(false);
    expect(namesHearingImpaired('A.Film.2020.1080p.WEB.H264-CHIPS')).toBe(false);
  });
});
