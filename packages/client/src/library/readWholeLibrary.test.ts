import { beforeEach, describe, expect, it, vi } from 'vitest';
import { readWholeLibrary } from './readWholeLibrary';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';

const fetchLibraryItemsMock = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchLibraryItems: fetchLibraryItemsMock,
}));

const anItem = (id: number): MediaSummary => ({
  id: `item-${id.toString()}`,
  libraryId: 'library-1',
  title: `Item ${id.toString()}`,
  year: 2024,
  durationSeconds: 60,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: null,
  seriesTitle: null,
  seasonNumber: null,
  episodeNumber: null,
});

const aPage = (count: number, total: number) => ({
  items: Array.from({ length: count }, (_unused, index) => anItem(index)),
  total,
});

beforeEach(() => {
  fetchLibraryItemsMock.mockReset();
});

describe('readWholeLibrary', () => {
  it('asks for no more than the server will give, so the read does not fail outright', async () => {
    fetchLibraryItemsMock.mockResolvedValue(aPage(3, 3));

    await readWholeLibrary('library-1');

    expect(fetchLibraryItemsMock).toHaveBeenCalledWith('library-1', {
      withVersions: false,
      limit: 200,
      offset: 0,
    });
  });

  it('reads past the first page, which is where a large library lives', async () => {
    fetchLibraryItemsMock.mockResolvedValueOnce(aPage(200, 260)).mockResolvedValueOnce({
      items: Array.from({ length: 60 }, (_unused, index) => anItem(200 + index)),
      total: 260,
    });

    const everything = await readWholeLibrary('library-1');

    expect(everything).toHaveLength(260);
    expect(fetchLibraryItemsMock).toHaveBeenNthCalledWith(2, 'library-1', {
      withVersions: false,
      limit: 200,
      offset: 200,
    });
  });

  it('stops once it has the lot, rather than asking for a page that is not there', async () => {
    fetchLibraryItemsMock.mockResolvedValue(aPage(200, 200));

    await readWholeLibrary('library-1');

    expect(fetchLibraryItemsMock).toHaveBeenCalledTimes(1);
  });

  it('fails when a later page fails, rather than passing part of a library off as the whole', async () => {
    fetchLibraryItemsMock
      .mockResolvedValueOnce(aPage(200, 400))
      .mockRejectedValueOnce(new Error('gone'));

    await expect(readWholeLibrary('library-1')).rejects.toThrow('gone');
  });

  it('fails when the first page fails, so the caller can tell nothing from an empty library', async () => {
    fetchLibraryItemsMock.mockRejectedValue(new Error('gone'));

    await expect(readWholeLibrary('library-1')).rejects.toThrow('gone');
  });

  it('asks for the pages after the first a few at a time, once it knows how many there are', async () => {
    let asking = 0;
    let mostAtOnce = 0;

    fetchLibraryItemsMock.mockImplementation(async (_libraryId, { offset }: { offset: number }) => {
      asking += 1;
      mostAtOnce = Math.max(mostAtOnce, asking);
      await Promise.resolve();
      asking -= 1;

      return {
        items: Array.from({ length: Math.min(200, 2000 - offset) }, (_unused, index) =>
          anItem(offset + index),
        ),
        total: 2000,
      };
    });

    const everything = await readWholeLibrary('library-1');

    expect(everything).toHaveLength(2000);
    expect(fetchLibraryItemsMock).toHaveBeenCalledTimes(10);
    expect(mostAtOnce).toBe(4);
  });

  it('keeps an item once when the pages overlap, as they do when something is added mid-read', async () => {
    fetchLibraryItemsMock
      .mockResolvedValueOnce(aPage(200, 260))
      .mockResolvedValueOnce({ items: [anItem(199), anItem(200)], total: 260 });

    const everything = await readWholeLibrary('library-1');

    expect(everything).toHaveLength(201);
  });

  it('reads a library larger than twenty thousand items in full', async () => {
    fetchLibraryItemsMock.mockImplementation((_libraryId, { offset }: { offset: number }) =>
      Promise.resolve({
        items: Array.from({ length: 200 }, (_unused, index) => anItem(offset + index)),
        total: 30_000,
      }),
    );

    await expect(readWholeLibrary('library-1')).resolves.toHaveLength(30_000);
  });

  it('fails rather than passing part off as the whole when the library is too large to list', async () => {
    fetchLibraryItemsMock.mockResolvedValue(aPage(200, 100_000_000));

    await expect(readWholeLibrary('library-1')).rejects.toThrow('more than can be listed');
    expect(fetchLibraryItemsMock).toHaveBeenCalledTimes(1);
  });

  it('reads a film’s other versions too where asked, for whoever manages the files', async () => {
    fetchLibraryItemsMock.mockResolvedValue(aPage(3, 3));

    await readWholeLibrary('library-1', true);

    expect(fetchLibraryItemsMock).toHaveBeenCalledWith(
      'library-1',
      expect.objectContaining({ withVersions: true }),
    );
  });
});
