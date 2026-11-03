import { describe, expect, it } from 'vitest';
import { SUBTITLE_SITE_NAMES } from './SUBTITLE_SITE_NAMES';

describe('SUBTITLE_SITE_NAMES', () => {
  it('names each subtitle site as it names itself', () => {
    expect(SUBTITLE_SITE_NAMES).toEqual({ opensubtitles: 'OpenSubtitles', subdl: 'SubDL' });
  });
});
