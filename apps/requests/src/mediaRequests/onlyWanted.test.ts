import { describe, expect, it } from 'vitest';
import { onlyWanted } from './onlyWanted';

const aFile = (path: string) => ({ path, name: path.split('/').at(-1) ?? path, sizeBytes: 1 });

describe('onlyWanted', () => {
  it('keeps the files the client is fetching, and leaves out the ones it skips', () => {
    const files = [
      aFile('/downloads/Pack/Episode 1.mkv'),
      aFile('/downloads/Pack/Episode 2.mkv'),
      aFile('/downloads/Pack/Sample/sample.mkv'),
    ];

    expect(onlyWanted(files, ['Pack/Episode 1.mkv'])).toEqual([files[0]]);
  });

  it('matches a torrent of one file by its name alone', () => {
    const files = [aFile('/downloads/Episode.mkv')];

    expect(onlyWanted(files, ['Episode.mkv'])).toEqual(files);
  });

  it('does not take one file for another whose name only ends the same', () => {
    expect(
      onlyWanted([aFile('/downloads/Pack/Bonus Episode 1.mkv')], ['Pack/Episode 1.mkv']),
    ).toEqual([]);
  });

  it('reads Windows paths the same way', () => {
    const files = [aFile('C:\\downloads\\Pack\\Episode 1.mkv')];

    expect(onlyWanted(files, ['Pack\\Episode 1.mkv'])).toEqual(files);
  });

  it('keeps every file where the client would not say which it is fetching', () => {
    const files = [aFile('/downloads/Pack/Episode 1.mkv'), aFile('/downloads/Pack/Episode 2.mkv')];

    expect(onlyWanted(files, null)).toEqual(files);
  });
});
