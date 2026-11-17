import { describe, expect, it } from 'vitest';
import { isShownAsASession } from './isShownAsASession';
const playing = { mediaId: 'film-1' };

describe('isShownAsASession', () => {
  it('shows somebody here on this server whether or not they are playing anything', () => {
    expect(isShownAsASession({ fromServer: null, playback: null })).toBe(true);
  });

  it('shows somebody watching through a linked server while they play something', () => {
    expect(isShownAsASession({ fromServer: 'KKONAW', playback: playing })).toBe(true);
  });

  it('leaves out somebody from a linked server once what they were playing has ended', () => {
    expect(isShownAsASession({ fromServer: 'KKONAW', playback: null })).toBe(false);
  });
});
