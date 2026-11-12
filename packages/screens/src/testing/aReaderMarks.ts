import { vi } from 'vitest';
import type { Mock } from 'vitest';
import type { Bookmark } from '@ValenceContracts/schemas/Book';
import type { ReaderMarks } from '@ValenceScreens/reading/ReaderMarks';

type WatchedMarks = ReaderMarks & {
  onMark: Mock<ReaderMarks['onMark']>;
  onUnmark: Mock<ReaderMarks['onUnmark']>;
};

/**
 * The bookmarks a reader is handed, with the list drawn as plain words and every change watched.
 *
 * @param here - The bookmarks in the chapter open.
 * @returns The bookmarks and their handlers.
 */
const aReaderMarks = (here: readonly Bookmark[] = []): WatchedMarks => ({
  here,
  list: 'The bookmarks',
  onMark: vi.fn<ReaderMarks['onMark']>(),
  onUnmark: vi.fn<ReaderMarks['onUnmark']>(),
});

export { aReaderMarks };
