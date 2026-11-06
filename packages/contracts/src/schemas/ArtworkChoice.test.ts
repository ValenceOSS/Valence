import { describe, expect, it } from 'vitest';
import { ArtworkChoicesSchema, ChooseArtworkSchema } from './ArtworkChoice';

const option = {
  url: 'https://image.tmdb.org/t/p/original/a.png',
  previewUrl: 'https://image.tmdb.org/t/p/w300/a.png',
  language: 'en',
  width: 1000,
  height: 400,
  votes: 3,
};

describe('ArtworkChoicesSchema', () => {
  it('reads the pictures offered and the ones chosen', () => {
    const read = ArtworkChoicesSchema.parse({
      kind: 'tv',
      options: { poster: [option], backdrop: [], logo: [{ ...option, language: null }] },
      chosen: { poster: option.url, backdrop: null, logo: null },
    });

    expect(read.options.logo[0]?.language).toBeNull();
    expect(read.chosen.poster).toBe(option.url);
  });

  it('refuses a kind of title the catalogue does not have', () => {
    expect(
      ArtworkChoicesSchema.safeParse({
        kind: 'book',
        options: { poster: [], backdrop: [], logo: [] },
        chosen: { poster: null, backdrop: null, logo: null },
      }).success,
    ).toBe(false);
  });
});

describe('ChooseArtworkSchema', () => {
  it('asks for an address, the catalogue’s or one of a picture kept on the server', () => {
    expect(ChooseArtworkSchema.safeParse({ url: '' }).success).toBe(false);
    expect(ChooseArtworkSchema.safeParse({ url: option.url }).success).toBe(true);
    expect(ChooseArtworkSchema.safeParse({ url: 'valence-disk:L2EuanBn' }).success).toBe(true);
  });
});
