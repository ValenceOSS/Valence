import { hintsAboutThisTv } from '@ValenceTv/platform/hintsAboutThisTv';

describe('hintsAboutThisTv', () => {
  it('describes an Apple TV as Valence’s own app on tvOS, by the name its owner gave it', () => {
    expect(hintsAboutThisTv('appleTv', 'Living Room')).toEqual({
      app: 'tv',
      system: 'tvos',
      form: 'tv',
      name: 'Living Room',
    });
  });

  it('describes an Android TV', () => {
    expect(hintsAboutThisTv('androidTv', 'Bedroom')).toEqual({
      app: 'tv',
      system: 'androidTv',
      form: 'tv',
      name: 'Bedroom',
    });
  });

  it('describes a Fire TV as Fire OS', () => {
    expect(hintsAboutThisTv('fireTv', 'Kitchen')).toEqual({
      app: 'tv',
      system: 'fireOs',
      form: 'tv',
      name: 'Kitchen',
    });
  });

  it('leaves the name out where the system gives none', () => {
    expect(hintsAboutThisTv('appleTv', null)).toEqual({ app: 'tv', system: 'tvos', form: 'tv' });
  });

  it('says only that a television’s own browser is a browser', () => {
    expect(hintsAboutThisTv('lgTv', 'Living Room')).toEqual({ app: 'browser' });
    expect(hintsAboutThisTv('samsungTv', null)).toEqual({ app: 'browser' });
    expect(hintsAboutThisTv('smartTv', null)).toEqual({ app: 'browser' });
  });
});
