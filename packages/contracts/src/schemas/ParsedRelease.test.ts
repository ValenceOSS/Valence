import { describe, expect, it } from 'vitest';
import { RELEASE_SOURCES, RESOLUTIONS, ResolutionSchema } from './ParsedRelease';

describe('ParsedRelease', () => {
  it('lists resolutions and sources best first, which is the order a profile starts from', () => {
    expect(RESOLUTIONS[0]).toBe('2160p');
    expect(RELEASE_SOURCES[0]).toBe('remux');
    expect(RELEASE_SOURCES.at(-1)).toBe('cam');
  });

  it('refuses a resolution it does not know', () => {
    expect(ResolutionSchema.safeParse('8k').success).toBe(false);
  });
});
