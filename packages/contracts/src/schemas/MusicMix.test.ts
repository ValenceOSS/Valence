import { describe, expect, it } from 'vitest';
import { MusicMixListSchema, MusicMixSummarySchema } from './MusicMix';

const SUMMARY = {
  id: 'decade-2020',
  kind: 'decade',
  title: '2020s Mix',
  detail: 'Music from the 2020s',
  trackCount: 30,
  coverAlbumIds: ['00000000-0000-4000-8000-00000000a1b1'],
};

describe('MusicMix', () => {
  it('reads a mix as the server lists it', () => {
    expect(MusicMixListSchema.parse({ mixes: [SUMMARY] })).toEqual({ mixes: [SUMMARY] });
  });

  it('refuses a mix of a kind Valence does not make', () => {
    expect(MusicMixSummarySchema.safeParse({ ...SUMMARY, kind: 'weekly' }).success).toBe(false);
  });

  it('refuses a mix with no id', () => {
    expect(MusicMixSummarySchema.safeParse({ ...SUMMARY, id: '' }).success).toBe(false);
  });
});
