import { describe, expect, it } from 'vitest';
import { queueUploads } from './queueUploads';

const fileAt = (name: string, relativePath = ''): File => {
  const file = new File(['x'], name);

  Object.defineProperty(file, 'webkitRelativePath', { value: relativePath });

  return file;
};

describe('queueUploads', () => {
  it('queues a file a library reads, at its own name where it was chosen alone', () => {
    const { queued, skipped } = queueUploads('movies', [fileAt('Arrival.mkv')]);

    expect(queued.map((one) => one.path)).toEqual(['Arrival.mkv']);
    expect(skipped).toEqual([]);
  });

  it('keeps the shape of a folder that was chosen', () => {
    const { queued } = queueUploads('shows', [
      fileAt('S01E01.mkv', 'Show/Season 1/S01E01.mkv'),
      fileAt('S01E02.mkv', 'Show/Season 1/S01E02.mkv'),
    ]);

    expect(queued.map((one) => one.path)).toEqual([
      'Show/Season 1/S01E01.mkv',
      'Show/Season 1/S01E02.mkv',
    ]);
  });

  it('leaves out what the library would not read, and says what', () => {
    const { queued, skipped } = queueUploads('movies', [
      fileAt('Arrival.mkv'),
      fileAt('cover.jpg', 'Arrival/cover.jpg'),
      fileAt('.DS_Store'),
    ]);

    expect(queued).toHaveLength(1);
    expect(skipped).toEqual(['Arrival/cover.jpg', '.DS_Store']);
  });

  it('starts every one waiting, with nothing said yet', () => {
    const [only] = queueUploads('music', [fileAt('01.flac')]).queued;

    expect(only).toMatchObject({ status: 'waiting', message: null });
  });

  it('gives every file its own id, even two of the same name from different folders', () => {
    const { queued } = queueUploads('movies', [
      fileAt('a.mkv', 'One/a.mkv'),
      fileAt('a.mkv', 'Two/a.mkv'),
    ]);

    expect(new Set(queued.map((one) => one.id)).size).toBe(2);
  });

  it('numbers from where it is told, so files added later do not share an id', () => {
    const [later] = queueUploads('movies', [fileAt('a.mkv')], 5).queued;

    expect(later?.id).toBe('5:a.mkv');
  });
});
