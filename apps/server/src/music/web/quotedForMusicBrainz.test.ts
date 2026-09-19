import { describe, expect, it } from 'vitest';
import { quotedForMusicBrainz } from './quotedForMusicBrainz';

describe('quotedForMusicBrainz', () => {
  it('quotes a name, escaping the quotation marks and backslashes in it', () => {
    expect(quotedForMusicBrainz('Say "Hi" \\o/')).toBe('"Say \\"Hi\\" \\\\o/"');
  });
});
