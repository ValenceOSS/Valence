import { describe, expect, it } from 'vitest';
import { readDroppedFiles } from './readDroppedFiles';
import type { Dropped, DroppedEntry } from './readDroppedFiles';

const aFile = (name: string): File => new File(['x'], name);

const aFileEntry = (
  fullPath: string,
  file = aFile(fullPath.split('/').pop() ?? ''),
): DroppedEntry => ({
  isFile: true,
  isDirectory: false,
  fullPath,
  file: (done: (file: File) => void) => {
    done(file);
  },
});

const aFolderEntry = (fullPath: string, contents: DroppedEntry[], batch = 100): DroppedEntry => {
  let read = 0;

  return {
    isFile: false,
    isDirectory: true,
    fullPath,
    createReader: () => ({
      readEntries: (done: (entries: DroppedEntry[]) => void) => {
        done(contents.slice(read, read + batch));
        read += batch;
      },
    }),
  };
};

const aDrop = (entries: (DroppedEntry | null)[], files: File[] = []): Dropped => ({
  items: entries.map((entry) => ({ webkitGetAsEntry: () => entry })),
  files,
});

describe('readDroppedFiles', () => {
  it('reads files dropped on their own, with no path', async () => {
    const found = await readDroppedFiles(aDrop([aFileEntry('/Arrival.mkv')]));

    expect(found.map((file) => [file.name, file.webkitRelativePath])).toEqual([
      ['Arrival.mkv', ''],
    ]);
  });

  it('reads a folder dropped, and every folder inside it, each file keeping where it was', async () => {
    const found = await readDroppedFiles(
      aDrop([
        aFolderEntry('/Show', [
          aFolderEntry('/Show/Season 1', [
            aFileEntry('/Show/Season 1/S01E01.mkv'),
            aFileEntry('/Show/Season 1/S01E02.mkv'),
          ]),
          aFileEntry('/Show/poster.jpg'),
        ]),
      ]),
    );

    expect(found.map((file) => file.webkitRelativePath).toSorted()).toEqual([
      'Show/Season 1/S01E01.mkv',
      'Show/Season 1/S01E02.mkv',
      'Show/poster.jpg',
    ]);
  });

  it('reads a folder that hands over its contents a few at a time, until it has given all', async () => {
    const found = await readDroppedFiles(
      aDrop([
        aFolderEntry(
          '/Album',
          ['1', '2', '3', '4', '5'].map((number) => aFileEntry(`/Album/${number}.flac`)),
          2,
        ),
      ]),
    );

    expect(found).toHaveLength(5);
  });

  it('reads files and folders dropped together', async () => {
    const found = await readDroppedFiles(
      aDrop([aFileEntry('/Loose.mkv'), aFolderEntry('/Films', [aFileEntry('/Films/A.mkv')])]),
    );

    expect(found.map((file) => file.webkitRelativePath).toSorted()).toEqual(['', 'Films/A.mkv']);
  });

  it('skips what could not be read, and keeps the rest', async () => {
    const broken: DroppedEntry = {
      isFile: true,
      isDirectory: false,
      fullPath: '/gone.mkv',
      file: (_done, fail) => {
        fail();
      },
    };

    const found = await readDroppedFiles(aDrop([broken, aFileEntry('/Kept.mkv')]));

    expect(found.map((file) => file.name)).toEqual(['Kept.mkv']);
  });

  it('takes the files it is given as they are where the browser will not say what they are', async () => {
    const files = [aFile('a.mkv'), aFile('b.mkv')];

    expect(await readDroppedFiles(aDrop([null], files))).toEqual(files);
  });
});
