import { describe, expect, it } from 'vitest';
import { libraryHolding } from './libraryHolding';
import type { Library } from '@ValenceContracts/schemas/Library';

const library = (id: string, path: string): Library => ({
  id,
  name: id,
  kind: 'movies',
  flavour: null,
  path,
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
  keepsShowsTogether: true,
});

const FILMS = library('films', '/media/Films');
const KIDS = library('kids', '/media/Films/Kids');

describe('libraryHolding', () => {
  it('finds the library whose folder holds a path', () => {
    expect(libraryHolding('/media/Films/Arrival (2016)/Arrival.mkv', [FILMS])).toBe(FILMS);
  });

  it('takes the deepest where one library sits inside another', () => {
    expect(libraryHolding('/media/Films/Kids/Up.mkv', [FILMS, KIDS])).toBe(KIDS);
  });

  it('does not count a folder that only starts with a library’s name', () => {
    expect(libraryHolding('/media/Films Archive/Old.mkv', [FILMS])).toBeNull();
  });

  it('does not count a library’s own folder as inside it', () => {
    expect(libraryHolding('/media/Films', [FILMS])).toBeNull();
  });
});
