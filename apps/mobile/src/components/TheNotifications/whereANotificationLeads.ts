const A_TITLE = /[?&]item=([^&#]+)/u;

const A_PROGRAMME = /[?&]show=([^&#]+)/u;

const A_BOOK = /[?&]book=([^&#]+)/u;

/**
 * Where a notification's link leads on a phone, read from the web address the server wrote for
 * it: a title's page, a programme's or a book's. Music and watch parties lead nowhere on a phone yet.
 *
 * @param link - The link the notification carries.
 * @returns The page it leads to, or null.
 */
const whereANotificationLeads = (
  link: string | null,
):
  | { kind: 'title'; mediaId: string }
  | { kind: 'series'; seriesId: string }
  | { kind: 'book'; bookId: string }
  | null => {
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
