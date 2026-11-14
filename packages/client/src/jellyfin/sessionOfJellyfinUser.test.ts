import { describe, expect, it } from 'vitest';
import { realEmailOf } from '@ValenceContracts/functions/realEmailOf';
import { createJellyfinIdBook } from './createJellyfinIdBook';
import { sessionOfJellyfinUser } from './sessionOfJellyfinUser';
import { aFakeStore } from './testing/aFakeStore';

describe('sessionOfJellyfinUser', () => {
  it('signs the Jellyfin user in by their name, with no email Valence would show', () => {
    const { user } = sessionOfJellyfinUser(
      { Id: 'f84099b104f7cc449c39c6564a016cfc', Name: 'marnie', Policy: { IsAdministrator: true } },
      createJellyfinIdBook(aFakeStore()),
    );

    expect(user).toMatchObject({ name: 'marnie', username: 'marnie', role: 'admin' });
    expect(realEmailOf(user.email)).toBeNull();
  });
});
