import { describe, expect, it, vi } from 'vitest';
import { createJellyfinIds } from './createJellyfinIds';
import { personJellyfinId } from './personJellyfinId';
import { seasonJellyfinId } from './seasonJellyfinId';
import { showJellyfinId } from './showJellyfinId';
import { aJellyfinBackend } from './testing/aJellyfinBackend';
import { aJellyfinCaller } from './testing/aJellyfinCaller';

describe('createJellyfinIds', () => {
  it('reads a library, a film and a person by their own identifiers', async () => {
    const { backend, film } = aJellyfinBackend();
    const ids = createJellyfinIds(backend);
    const caller = aJellyfinCaller();

    expect(await ids.read(caller, film.libraryId.replaceAll('-', ''))).toMatchObject({
      kind: 'library',
    });
    expect(await ids.read(caller, film.id.replaceAll('-', ''))).toEqual({
      kind: 'media',
      mediaId: film.id,
    });
    expect(await ids.read(caller, personJellyfinId(9))).toEqual({ kind: 'person', personId: 9 });
  });

  it('reads a programme and its seasons once they were handed out', async () => {
    const { backend, show } = aJellyfinBackend();
    const ids = createJellyfinIds(backend);
    const caller = aJellyfinCaller();

    ids.remember(show.libraryId, show.id);

    expect(await ids.read(caller, showJellyfinId(show.libraryId, show.id))).toEqual({
      kind: 'show',
      libraryId: show.libraryId,
      showId: show.id,
    });
    expect(await ids.read(caller, seasonJellyfinId(`${show.libraryId}:${show.id}`, 2))).toEqual({
      kind: 'season',
      libraryId: show.libraryId,
      showId: show.id,
      seasonNumber: 2,
    });
  });

  it('works a programme out again from the libraries after a restart', async () => {
    const { backend, show } = aJellyfinBackend();
    const listShows = vi.spyOn(backend, 'listShows');
    const ids = createJellyfinIds(backend);

    expect(
      await ids.read(aJellyfinCaller(), showJellyfinId(show.libraryId, show.id)),
    ).toMatchObject({ kind: 'show', showId: show.id });
    expect(listShows).toHaveBeenCalledWith(expect.anything(), show.libraryId);
  });

  it('reads nothing for an identifier that is nothing here', async () => {
    const { backend } = aJellyfinBackend();

    expect(await createJellyfinIds(backend).read(aJellyfinCaller(), 'f'.repeat(32))).toBeNull();
  });
});
