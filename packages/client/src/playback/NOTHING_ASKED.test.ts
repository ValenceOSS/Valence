import { describe, expect, it } from 'vitest';
import { NOTHING_ASKED } from './NOTHING_ASKED';

describe('NOTHING_ASKED', () => {
  it('asks for neither a track nor a language', () => {
    expect(NOTHING_ASKED).toEqual({ audioStreamIndex: undefined, audioLanguage: undefined });
  });
});
