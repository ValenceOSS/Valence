import { describe, expect, it } from 'vitest';
import { aLibrary } from '@ValenceClient/testing/aLibrary';
import { librariesChosen } from './librariesChosen';

const MINE = aLibrary({ id: 'mine' });
const THEIRS = aLibrary({ id: 'theirs', linkedServerId: 'films' });
const OTHERS = aLibrary({ id: 'others', linkedServerId: 'books' });
const ALL = [MINE, THEIRS, OTHERS];

describe('librariesChosen', () => {
  it('stands for every library where nothing is chosen', () => {
    expect(librariesChosen(ALL, null)).toEqual(ALL);
  });

  it('stands for this server’s own, for here', () => {
    expect(librariesChosen(ALL, 'here')).toEqual([MINE]);
  });

  it('stands for everything one linked server shares', () => {
    expect(librariesChosen(ALL, 'from:films')).toEqual([THEIRS]);
  });

  it('stands for one library by its id', () => {
    expect(librariesChosen(ALL, 'others')).toEqual([OTHERS]);
  });

  it('stands for every library where the choice names nothing there is', () => {
    expect(librariesChosen(ALL, 'nothing')).toEqual(ALL);
  });
});
