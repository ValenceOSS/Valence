import { describe, expect, it } from 'vitest';
import { twoLinkingServers } from '@ValenceServer/testing/twoLinkingServers';
import { createMemoryLinkSharingStore } from './createMemoryLinkSharingStore';
import { signAsPerson } from './signAsPerson';

const SAM = { profileId: 'sam', name: 'Sam' };

/**
 * Anime and Films, linked, with what Films shares with Anime kept in memory.
 *
 * @returns Both, Anime's id at Films, and Films' sharing store.
 */
const linked = async () => {
  const { anime, films, filmsStore, link } = twoLinkingServers();
  const { animeAtFilms } = await link();
  const sharing = createMemoryLinkSharingStore(
    async (id) => (await filmsStore.readServer(id)) !== null,
  );

  return { anime, films, animeAtFilms, sharing };
};

describe('signAsPerson', () => {
  it('signs as the server itself where it asks for nobody', async () => {
    const { anime, films, animeAtFilms, sharing } = await linked();
    const signed = await signAsPerson(films, sharing, animeAtFilms, null);

    expect((await anime.readToken(signed?.token ?? ''))?.person).toBeNull();
  });

  it('signs as somebody by a pseudonym, with their name where names travel', async () => {
    const { anime, films, animeAtFilms, sharing } = await linked();
    const signed = await signAsPerson(films, sharing, animeAtFilms, SAM);
    const read = await anime.readToken(signed?.token ?? '');

    expect(read?.person?.name).toBe('Sam');
    expect(read?.person?.pseudonym).not.toContain('sam');
  });

  it('keeps the name back where names do not travel, and the pseudonym stays the same', async () => {
    const { anime, films, animeAtFilms, sharing } = await linked();
    const named = await anime.readToken(
      (await signAsPerson(films, sharing, animeAtFilms, SAM))?.token ?? '',
    );

    await sharing.changeSharing(animeAtFilms, { namesTravel: false });

    const unnamed = await anime.readToken(
      (await signAsPerson(films, sharing, animeAtFilms, SAM))?.token ?? '',
    );

    expect(unnamed?.person).toEqual({ pseudonym: named?.person?.pseudonym, name: null });
  });

  it('signs nothing for a server it is not linked with', async () => {
    const { films, sharing } = await linked();

    expect(
      await signAsPerson(films, sharing, '00000000-0000-4000-8000-000000000000', SAM),
    ).toBeNull();
  });
});
