import { describe, expect, it } from 'vitest';
import { nameOfFile } from './nameOfFile';

describe('nameOfFile', () => {
  it('drops the folders above a file, which say nothing a scan line has room for', () => {
    expect(nameOfFile('/media/downloads/movies/Arrival (2016)/Arrival.mkv')).toBe('Arrival');
  });

  it('drops the extension', () => {
    expect(nameOfFile('/media/Some Film.mkv')).toBe('Some Film');
  });

  it('reads separators as spaces, the way a scene release writes them', () => {
    expect(nameOfFile('/media/The.Thick.Of.It.S01E01.mkv')).toBe('The Thick Of It S01E01');
  });

  it('keeps a name that has no folders above it at all', () => {
    expect(nameOfFile('Arrival.mkv')).toBe('Arrival');
  });

  it('keeps a name that tidies away to nothing rather than showing an empty line', () => {
    expect(nameOfFile('/media/___.mkv')).toBe('___.mkv');
  });
});
