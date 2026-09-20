import { describe, expect, it } from 'vitest';
import { CaptchaNeeded } from './CaptchaNeeded';
import { IndexerFailure } from './IndexerFailure';

describe('CaptchaNeeded', () => {
  it('carries the picture, and is a failure like any other', () => {
    const needed = new CaptchaNeeded('data:image/png;base64,AQID');

    expect(needed.image).toBe('data:image/png;base64,AQID');
    expect(needed.message).toBe('Type the characters in the picture to log in');
    expect(needed.name).toBe('CaptchaNeeded');
    expect(needed).toBeInstanceOf(IndexerFailure);
  });
});
