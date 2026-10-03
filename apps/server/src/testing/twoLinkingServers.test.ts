import { describe, expect, it } from 'vitest';
import { twoLinkingServers } from './twoLinkingServers';

describe('twoLinkingServers', () => {
  it('links the two servers to each other', async () => {
    const { anime, films, link } = twoLinkingServers();
    const { filmsAtAnime, animeAtFilms } = await link();

    expect((await anime.linking()).servers).toEqual([
      expect.objectContaining({ id: filmsAtAnime, name: 'Films', state: 'linked' }),
    ]);
    expect((await films.linking()).servers).toEqual([
      expect.objectContaining({ id: animeAtFilms, name: 'Anime', state: 'linked' }),
    ]);
  });
});
