import { describe, expect, it, vi } from 'vitest';
import { createChapterNamer } from './createChapterNamer';
import type { ChapterShelf } from './createChapterNamer';

const aShelf = () => {
  const renamed: [string, string][] = [];
  const shelf: ChapterShelf = {
    listComicChapters: () =>
      Promise.resolve([
        {
          title: 'Rent-A-Girlfriend',
          seriesName: null,
          chapters: [
            { id: 'one', number: 1, title: 'Rent-A-Girlfriend' },
            { id: 'two', number: 2, title: 'A Name Of Its Own' },
            { id: 'three', number: 3, title: 'Chapter 3' },
          ],
        },
        {
          title: 'Named',
          seriesName: 'Series',
          chapters: [{ id: 'four', number: 1, title: 'Already named' }],
        },
      ]),
    renameChapter: (id, title) => {
      renamed.push([id, title]);

      return Promise.resolve();
    },
  };

  return { shelf, renamed };
};

describe('createChapterNamer', () => {
  it('renames only placeholder chapters, with the name found for their number', async () => {
    const { shelf, renamed } = aShelf();
    const find = vi.fn(() =>
      Promise.resolve(
        new Map([
          [1, 'Rental Girlfriend'],
          [2, 'Other'],
        ]),
      ),
    );

    await expect(createChapterNamer(shelf, find)('library')).resolves.toBe(1);
    expect(renamed).toEqual([['one', 'Rental Girlfriend']]);
    expect(find).toHaveBeenCalledTimes(1);
    expect(find).toHaveBeenCalledWith('Rent-A-Girlfriend');
  });

  it('looks a series up once a day however often it is scanned', async () => {
    let at = 0;
    const find = vi.fn(() => Promise.resolve(new Map<number, string>()));
    const name = createChapterNamer(aShelf().shelf, find, () => at);

    await name('library');
    at = 60 * 60 * 1000;
    await name('library');
    expect(find).toHaveBeenCalledTimes(1);

    at = 25 * 60 * 60 * 1000;
    await name('library');
    expect(find).toHaveBeenCalledTimes(2);
  });

  it('renames nothing where the lookup fails', async () => {
    const { shelf, renamed } = aShelf();

    await expect(
      createChapterNamer(shelf, () => Promise.reject(new Error('offline')))('library'),
    ).resolves.toBe(0);
    expect(renamed).toEqual([]);
  });
});
