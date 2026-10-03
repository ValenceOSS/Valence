import { describe, expect, it } from 'vitest';
import { pathInLibrary } from './pathInLibrary';

describe('pathInLibrary', () => {
  it('writes a path as it sits inside its library', () => {
    expect(pathInLibrary('/media/films/Arrival (2016)/Arrival.mkv', '/media/films')).toBe(
      'Arrival (2016)/Arrival.mkv',
    );
  });

  it('keeps the whole path where it is not inside the library, or is the library', () => {
    expect(pathInLibrary('/elsewhere/Arrival.mkv', '/media/films')).toBe('/elsewhere/Arrival.mkv');
    expect(pathInLibrary('/media/films', '/media/films')).toBe('/media/films');
  });
});
