import { describe, expect, it } from 'vitest';
import { isAboutViewing } from './isAboutViewing';

describe('isAboutViewing', () => {
  it('knows playing and sessions from everything else', () => {
    expect(isAboutViewing('playback.paused')).toBe(true);
    expect(isAboutViewing('session.ended')).toBe(true);
    expect(isAboutViewing('requests.made')).toBe(false);
    expect(isAboutViewing('profile.removed')).toBe(false);
    expect(isAboutViewing('nothing.at.all')).toBe(false);
  });
});
