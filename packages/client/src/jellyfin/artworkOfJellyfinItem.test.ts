import { describe, expect, it } from 'vitest';
import { artworkOfJellyfinItem } from './artworkOfJellyfinItem';
import { aJellyfinEpisode } from './testing/aJellyfinEpisode';
import { aJellyfinFilm } from './testing/aJellyfinFilm';

describe('artworkOfJellyfinItem', () => {
  it('gives a film its own poster, backdrop and logo', () => {
    const artwork = artworkOfJellyfinItem(aJellyfinFilm(), 'http://j.test');

    expect(artwork.poster).toContain('/Items/87d216619130f7261a2f6c054af5ff81/Images/Primary?');
    expect(artwork.backdrop).toContain('/Images/Backdrop?tag=bf54');
    expect(artwork.titleBackdrop).toBe(artwork.backdrop);
    expect(artwork.logo).toContain('/Images/Logo?');
  });

  it('gives an episode its programme’s poster, backdrop and logo, and its own still', () => {
    const artwork = artworkOfJellyfinItem(aJellyfinEpisode(), 'http://j.test');

    expect(artwork.poster).toContain(
      '/Items/8fda75b958575a5b48cb9ffb2a2fbff6/Images/Primary?tag=6ab1',
    );
    expect(artwork.backdrop).toContain('/Items/a4cbf06e10347cf76f804f2eee4c01d6/Images/Primary?');
    expect(artwork.titleBackdrop).toContain(
      '/Items/8fda75b958575a5b48cb9ffb2a2fbff6/Images/Backdrop?',
    );
    expect(artwork.logo).toContain('/Items/8fda75b958575a5b48cb9ffb2a2fbff6/Images/Logo?');
  });

  it('gives nothing an item has no picture for', () => {
    expect(
      artworkOfJellyfinItem(
        aJellyfinFilm({ ImageTags: {}, BackdropImageTags: [] }),
        'http://j.test',
      ),
    ).toEqual({});
  });
});
