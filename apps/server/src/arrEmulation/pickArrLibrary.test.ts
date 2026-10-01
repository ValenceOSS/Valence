import { describe, expect, it } from 'vitest';
import { pickArrLibrary } from './pickArrLibrary';

const FILMS = { id: 'f', name: 'Films', path: '/media/Films', freeBytes: 0, totalBytes: 0 };

describe('pickArrLibrary', () => {
  it('finds the library offered as that root folder', () => {
    expect(pickArrLibrary([FILMS], '/media/Films')).toBe(FILMS);
  });

  it('pays no mind to a slash at the end', () => {
    expect(pickArrLibrary([FILMS], '/media/Films/')).toBe(FILMS);
  });

  it('finds nothing for a folder that is no library', () => {
    expect(pickArrLibrary([FILMS], '/media/Other')).toBeUndefined();
    expect(pickArrLibrary([FILMS], undefined)).toBeUndefined();
  });
});
