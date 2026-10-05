import { readMusicView } from '@ValenceClient/music/musicView';

const A_TITLE = /[?&]item=([^&#]+)/u;

const A_PROGRAMME = /[?&]show=([^&#]+)/u;

const A_BOOK = /[?&]book=([^&#]+)/u;

const A_MUSIC_VIEW = /[?&]listen=([^&#]+)/u;

/**
 * Where a notification's link leads on a phone, read from the web address the server wrote for
 * it: a title's page, a programme's or a book's, an album's, or a playlist's — opened on requesting
 * its missing songs where the notice says their albums were found. An invitation into a party is
 * read for itself.
 *
 * @param link - The link the notification carries.
 * @returns The page it leads to, or null.
 */
const whereANotificationLeads = (
  link: string | null,
):
  | { kind: 'title'; mediaId: string }
  | { kind: 'album'; albumId: string }
  | { kind: 'playlist'; playlistId: string; isRequestingMissing?: boolean }
  | { kind: 'series'; seriesId: string }
  | { kind: 'book'; bookId: string }
  | null => {
  const listening = link?.startsWith('/music?') === true ? A_MUSIC_VIEW.exec(link)?.[1] : undefined;

  if (listening !== undefined) {
    const view = readMusicView(decodeURIComponent(listening));

    return view.kind === 'album'
      ? { kind: 'album', albumId: view.id }
      : view.kind === 'playlist'
        ? {
            kind: 'playlist',
            playlistId: view.id,
            ...(view.isRequestingMissing === true ? { isRequestingMissing: true } : {}),
          }
        : null;
  }

  if (link === null || !link.startsWith('/?')) {
    return null;
  }

  const title = A_TITLE.exec(link)?.[1];

  if (title !== undefined) {
    return { kind: 'title', mediaId: decodeURIComponent(title) };
  }

  const book = A_BOOK.exec(link)?.[1];

  if (book !== undefined) {
    return { kind: 'book', bookId: decodeURIComponent(book) };
  }

  const programme = A_PROGRAMME.exec(link)?.[1];

  return programme === undefined
    ? null
    : { kind: 'series', seriesId: decodeURIComponent(programme) };
};

export { whereANotificationLeads };
