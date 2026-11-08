/* oxlint-disable valence/no-hard-coded-strings -- file format names, the same in every language */
type BookFileType = { label: string; extension: string; isHeard: boolean };

const BOOK_FILE_TYPES: Readonly<Record<string, BookFileType>> = {
  'application/epub+zip': { label: 'EPUB', extension: 'epub', isHeard: false },
  'application/x-mobipocket-ebook': { label: 'MOBI', extension: 'mobi', isHeard: false },
  'application/x-mobi8-ebook': { label: 'AZW3', extension: 'azw3', isHeard: false },
  'application/vnd.amazon.ebook': { label: 'AZW3', extension: 'azw3', isHeard: false },
  'application/pdf': { label: 'PDF', extension: 'pdf', isHeard: false },
  'application/vnd.comicbook+zip': { label: 'CBZ', extension: 'cbz', isHeard: false },
  'application/x-cbz': { label: 'CBZ', extension: 'cbz', isHeard: false },
  'application/vnd.comicbook-rar': { label: 'CBR', extension: 'cbr', isHeard: false },
  'application/x-cbr': { label: 'CBR', extension: 'cbr', isHeard: false },
  'audio/mp4': { label: 'M4B', extension: 'm4b', isHeard: true },
  'audio/x-m4b': { label: 'M4B', extension: 'm4b', isHeard: true },
  'audio/m4b': { label: 'M4B', extension: 'm4b', isHeard: true },
  'audio/mpeg': { label: 'MP3', extension: 'mp3', isHeard: true },
};

export type { BookFileType };

export { BOOK_FILE_TYPES };
