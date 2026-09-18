import { describe, expect, it, vi } from 'vitest';
import { clearLibraryParts } from './clearLibraryParts';
import type { ClearableLibrary } from './clearLibraryParts';
import type { LibraryPart } from '@ValenceContracts/schemas/LibraryPart';
import type { RebuildSubject } from './rebuildItemArtefacts';

const LIBRARY = '00000000-0000-4000-8000-00000000f1f1';

const ITEM = (path: string): RebuildSubject => ({
  path,
  audioStreams: [],
  generation: 3,
  defaultAudioLanguage: null,
});

const TRICKPLAY = { intervalSeconds: 10, tileWidth: 320, columns: 10, rows: 10 };

/**
 * Builds a library to clear, holding the given pictures and files for the parts that point at them,
 * and the given items for the parts the transcoder draws.
 */
const aLibrary = (
  held: Partial<Record<LibraryPart, string[]>> = {},
  made: RebuildSubject[] = [],
) => {
  const store = {
    empty: vi.fn<ClearableLibrary['empty']>((_, part) => Promise.resolve(held[part] ?? [])),
    listMade: vi.fn<ClearableLibrary['listMade']>(() => Promise.resolve(made)),
    forgetMade: vi.fn<ClearableLibrary['forgetMade']>(() => Promise.resolve()),
  };

  const images = { forget: vi.fn<(where: string) => Promise<void>>(() => Promise.resolve()) };
  const files = { remove: vi.fn<(where: string) => Promise<void>>(() => Promise.resolve()) };
  const transcoder = {
    forgetPreview: vi.fn(() => Promise.resolve(true)),
    forgetTrickplay: vi.fn(() => Promise.resolve(true)),
  };

  return { store, images, files, transcoder };
};

/**
 * Clears the given parts of a library built by `aLibrary`.
 */
const clear = (
  parts: LibraryPart[],
  library: ReturnType<typeof aLibrary>,
  extra: {
    onProgress?: (done: number, total: number) => void;
    isCancelled?: () => Promise<boolean>;
    onProblem?: (what: string, reason: string) => void;
  } = {},
) =>
  clearLibraryParts({
    libraryId: LIBRARY,
    parts,
    ...library,
    quality: 'standard',
    trickplay: TRICKPLAY,
    ...extra,
  });

describe('clearLibraryParts', () => {
  it('empties each chosen part and nothing else', async () => {
    const library = aLibrary();

    expect(await clear(['descriptions', 'cast'], library)).toBe(true);

    expect(library.store.empty.mock.calls).toEqual([
      [LIBRARY, 'descriptions'],
      [LIBRARY, 'cast'],
    ]);
    expect(library.store.listMade).not.toHaveBeenCalled();
    expect(library.transcoder.forgetPreview).not.toHaveBeenCalled();
  });

  it('throws away the kept copies of the artwork and logos it cleared', async () => {
    const library = aLibrary({
      artwork: ['https://images.test/poster.jpg', 'https://images.test/backdrop.jpg'],
      logos: ['https://images.test/logo.png'],
    });

    await clear(['artwork', 'logos'], library);

    expect(library.images.forget.mock.calls.flat()).toEqual([
      'https://images.test/poster.jpg',
      'https://images.test/backdrop.jpg',
      'https://images.test/logo.png',
    ]);
    expect(library.files.remove).not.toHaveBeenCalled();
  });

  it('removes the drawn covers and pictures of the music it cleared', async () => {
    const library = aLibrary({
      albumCovers: ['/cache/music/album-a1.webp'],
      artistPictures: ['/cache/music/artist-b2.webp'],
    });

    await clear(['albumCovers', 'artistPictures'], library);

    expect(library.files.remove.mock.calls.flat()).toEqual([
      '/cache/music/album-a1.webp',
      '/cache/music/artist-b2.webp',
    ]);
    expect(library.images.forget).not.toHaveBeenCalled();
  });

  it('forgets every preview clip it drew, and that it drew them', async () => {
    const library = aLibrary({}, [ITEM('/media/a.mkv'), ITEM('/media/b.mkv')]);

    await clear(['previews'], library);

    expect(library.store.forgetMade).toHaveBeenCalledWith(LIBRARY, 'previews');
    expect(library.transcoder.forgetPreview).toHaveBeenCalledTimes(2);
    expect(library.transcoder.forgetPreview).toHaveBeenCalledWith(
      expect.objectContaining({ inputPath: '/media/a.mkv', generation: 3, quality: 'standard' }),
    );
    expect(library.transcoder.forgetTrickplay).not.toHaveBeenCalled();
  });

  it('forgets every scrub preview it drew, at the size they were drawn', async () => {
    const library = aLibrary({}, [ITEM('/media/a.mkv')]);

    await clear(['scrubPreviews'], library);

    expect(library.store.forgetMade).toHaveBeenCalledWith(LIBRARY, 'scrubPreviews');
    expect(library.transcoder.forgetTrickplay).toHaveBeenCalledWith({
      inputPath: '/media/a.mkv',
      generation: 3,
      ...TRICKPLAY,
    });
  });

  it('asks which items were drawn once, however many drawn parts are cleared', async () => {
    const library = aLibrary({}, [ITEM('/media/a.mkv')]);

    await clear(['previews', 'scrubPreviews'], library);

    expect(library.store.listMade).toHaveBeenCalledTimes(1);
  });

  it('counts each drawn item as a step, since that is where the time goes', async () => {
    const library = aLibrary({}, [ITEM('/media/a.mkv'), ITEM('/media/b.mkv')]);
    const onProgress = vi.fn();

    await clear(['descriptions', 'previews'], library, { onProgress });

    expect(onProgress.mock.calls).toEqual([
      [1, 3],
      [2, 3],
      [3, 3],
    ]);
  });

  it('stops between steps when asked to, and says it did not finish', async () => {
    const library = aLibrary({}, [ITEM('/media/a.mkv'), ITEM('/media/b.mkv')]);

    const finished = await clear(['previews', 'cast'], library, {
      isCancelled: () => Promise.resolve(true),
    });

    expect(finished).toBe(false);
    expect(library.transcoder.forgetPreview).toHaveBeenCalledTimes(1);
    expect(library.store.empty).not.toHaveBeenCalled();
  });

  it('carries on past a clip the transcoder could not forget, and says which', async () => {
    const library = aLibrary({}, [ITEM('/media/a.mkv'), ITEM('/media/b.mkv')]);
    const onProblem = vi.fn();

    library.transcoder.forgetPreview.mockRejectedValueOnce(new Error('It is not answering.'));

    expect(await clear(['previews'], library, { onProblem })).toBe(true);

    expect(onProblem).toHaveBeenCalledWith('/media/a.mkv', 'It is not answering.');
    expect(library.transcoder.forgetPreview).toHaveBeenCalledTimes(2);
  });

  it('carries on past a picture it could not throw away, and says which', async () => {
    const library = aLibrary({ artwork: ['https://images.test/poster.jpg'] });
    const onProblem = vi.fn();

    library.images.forget.mockRejectedValueOnce(new Error('Read-only disk.'));

    expect(await clear(['artwork', 'cast'], library, { onProblem })).toBe(true);

    expect(onProblem).toHaveBeenCalledWith('https://images.test/poster.jpg', 'Read-only disk.');
    expect(library.store.empty).toHaveBeenCalledWith(LIBRARY, 'cast');
  });

  it('carries on past a music picture it could not remove, and says which', async () => {
    const library = aLibrary({ albumCovers: ['/cache/music/album-a1.webp'] });
    const onProblem = vi.fn();

    library.files.remove.mockRejectedValueOnce(new Error('Gone already.'));

    expect(await clear(['albumCovers'], library, { onProblem })).toBe(true);

    expect(onProblem).toHaveBeenCalledWith('/cache/music/album-a1.webp', 'Gone already.');
  });
});
