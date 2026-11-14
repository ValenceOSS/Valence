import { describe, expect, it } from 'vitest';
import { z } from 'zod';
import { createJellyfinIdBook } from './createJellyfinIdBook';
import { aFakeStore } from './testing/aFakeStore';

describe('createJellyfinIdBook', () => {
  it('turns Jellyfin’s digits into a UUID Valence accepts, and back', () => {
    const book = createJellyfinIdBook(aFakeStore());
    const valenceId = book.valenceIdOf('87d216619130f7261a2f6c054af5ff81');

    expect(z.string().uuid().safeParse(valenceId).success).toBe(true);
    expect(book.jellyfinIdOf(valenceId)).toBe('87d216619130f7261a2f6c054af5ff81');
  });

  it('turns back after a restart, from what the device kept', async () => {
    const store = aFakeStore();
    const valenceId = createJellyfinIdBook(store).valenceIdOf('457f6cd606230a3b7e097a60dafd357d');

    await Promise.resolve();

    expect(createJellyfinIdBook(store).jellyfinIdOf(valenceId)).toBe(
      '457f6cd606230a3b7e097a60dafd357d',
    );
  });

  it('leaves anything that is not thirty-two digits as it is', () => {
    expect(createJellyfinIdBook(aFakeStore()).valenceIdOf('not-an-id')).toBe('not-an-id');
  });
});
