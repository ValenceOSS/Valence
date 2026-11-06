import { describe, expect, it } from 'vitest';
import { trailInLibrary } from './trailInLibrary';

describe('trailInLibrary', () => {
  it('starts at the library, named for it, and walks down to the folder', () => {
    expect(trailInLibrary('/media/films/Arrival (2016)/Extras', '/media/films', 'Films')).toEqual([
      { label: 'Films', path: '/media/films' },
      { label: 'Arrival (2016)', path: '/media/films/Arrival (2016)' },
      { label: 'Extras', path: '/media/films/Arrival (2016)/Extras' },
    ]);
  });

  it('is only the library, at the library', () => {
    expect(trailInLibrary('/media/films', '/media/films', 'Films')).toEqual([
      { label: 'Films', path: '/media/films' },
    ]);
  });
});
