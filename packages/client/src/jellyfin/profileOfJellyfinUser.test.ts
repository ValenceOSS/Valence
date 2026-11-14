import { describe, expect, it } from 'vitest';
import { createJellyfinIdBook } from './createJellyfinIdBook';
import { profileOfJellyfinUser } from './profileOfJellyfinUser';
import { aFakeStore } from './testing/aFakeStore';

describe('profileOfJellyfinUser', () => {
  it('makes the Jellyfin user the account’s own profile, with no PIN and no asking', () => {
    expect(
      profileOfJellyfinUser(
        { Id: 'f84099b104f7cc449c39c6564a016cfc', Name: 'marnie' },
        createJellyfinIdBook(aFakeStore()),
      ),
    ).toMatchObject({ name: 'marnie', isOwner: true, hasPin: false, mayRequest: false });
  });
});
