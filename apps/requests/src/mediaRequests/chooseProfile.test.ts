import { describe, expect, it } from 'vitest';
import { aProfile } from '@ValenceRequests/testing/aProfile';
import { chooseProfile } from './chooseProfile';

const LIBRARYS = aProfile({ id: '0f8fad5b-d9cb-469f-a165-70867728950e', libraryIds: ['films'] });

const CHOSEN = aProfile({ id: '6ba7b810-9dad-11d1-80b4-00c04fd430c8' });

const MUSIC = aProfile({
  id: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
  kind: 'music',
  libraryIds: ['films'],
});

describe('chooseProfile', () => {
  it('takes the profile chosen for the request before its library’s', () => {
    expect(
      chooseProfile({ kind: 'film', profileId: CHOSEN.id, libraryId: 'films' }, [LIBRARYS, CHOSEN]),
    ).toBe(CHOSEN);
    expect(
      chooseProfile({ kind: 'film', profileId: null, libraryId: 'films' }, [MUSIC, LIBRARYS]),
    ).toBe(LIBRARYS);
  });

  it('has none where neither names one for films and series', () => {
    expect(
      chooseProfile({ kind: 'film', profileId: null, libraryId: 'films' }, [MUSIC]),
    ).toBeNull();
  });

  it('takes a profile that names no library where none names this one', () => {
    const anywhere = aProfile({ id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301', libraryIds: [] });

    expect(chooseProfile({ kind: 'film', profileId: null, libraryId: 'films' }, [anywhere])).toBe(
      anywhere,
    );
  });

  it('prefers the profile written for this library over one written for all of them', () => {
    const anywhere = aProfile({ id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301', libraryIds: [] });

    expect(
      chooseProfile({ kind: 'film', profileId: null, libraryId: 'films' }, [anywhere, LIBRARYS]),
    ).toBe(LIBRARYS);
  });

  it('takes a music profile for an artist or an album', () => {
    expect(
      chooseProfile({ kind: 'artist', profileId: null, libraryId: 'films' }, [LIBRARYS, MUSIC]),
    ).toBe(MUSIC);
    expect(
      chooseProfile({ kind: 'album', profileId: CHOSEN.id, libraryId: 'albums' }, [CHOSEN]),
    ).toBeNull();
  });
});
