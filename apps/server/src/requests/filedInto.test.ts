import { describe, expect, it } from 'vitest';
import { filedInto } from './filedInto';

describe('filedInto', () => {
  it('drops a filing folder the change names where it moves into no library', () => {
    expect(filedInto({ libraryPath: '/etc', isPickedByHand: true }, undefined)).toEqual({
      isPickedByHand: true,
    });
  });

  it('files into the library’s own folder, not the one the change names', () => {
    expect(
      filedInto({ libraryId: 'films', libraryPath: '/etc' }, { path: '/media/films' }),
    ).toEqual({ libraryId: 'films', libraryPath: '/media/films' });
  });

  it('prefers the folder the library says requests are filed under', () => {
    expect(
      filedInto({ libraryId: 'films' }, { path: '/media/films', requestPath: '/requests/films' }),
    ).toEqual({ libraryId: 'films', libraryPath: '/requests/films' });
  });
});
