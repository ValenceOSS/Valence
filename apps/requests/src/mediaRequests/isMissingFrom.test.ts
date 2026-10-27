import { describe, expect, it } from 'vitest';
import { isMissingFrom } from './isMissingFrom';

const HASH = 'c12fe1c06bba254a9dc9f519b335aa7c1367a88a';

const missing = { missingFrom: [{ title: 'Example.Show.S01.1080p-GRP', infoHash: HASH }] };

describe('isMissingFrom', () => {
  it('knows a release by its name, whatever its case', () => {
    expect(isMissingFrom(missing, 'example.show.s01.1080p-grp', null)).toBe(true);
  });

  it('knows a release by its torrent’s hash under any other name', () => {
    expect(isMissingFrom(missing, 'Another.Name', HASH.toUpperCase())).toBe(true);
  });

  it('knows nothing of a release it was not missing from', () => {
    expect(isMissingFrom(missing, 'Another.Name', null)).toBe(false);
    expect(isMissingFrom({}, 'Example.Show.S01.1080p-GRP', HASH)).toBe(false);
  });
});
