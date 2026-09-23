const EDITION = /\s*[([](un)?abridged[)\]]\s*$/i;

/**
 * An audiobook's title, cleaned of the edition a shop adds to it.
 *
 * @param said - The title as tagged.
 * @returns It cleaned, or nothing where nothing is left.
 */
const cleanOf = (said: string | null | undefined): string | null => {
  const cleaned = (said ?? '').replace(EDITION, '').trim();

  return cleaned === '' ? null : cleaned;
};

/**
 * What an audiobook is called, from the tags on its sound: the album, which every track of one book
 * shares — unless the track's own title says the same thing more briefly, as a single-file book's
 * often does, "Dark Age" beside "Red Rising, Book 5 - Dark Age", or the album says it more briefly
 * than a title that goes on, "Golden Son" beside "Golden Son: Book II of the Red Rising Trilogy".
 * "(Unabridged)" and "(Abridged)" are left off either.
 *
 * @param tags - The album and the title the sound is tagged with.
 * @returns The book's title, or nothing where neither says.
 */
const audiobookTitleOf = (tags: {
  album?: string | null | undefined;
  title?: string | null | undefined;
}): string | null => {
  const album = cleanOf(tags.album);
  const title = cleanOf(tags.title);

  if (album === null || title === null) {
    return album ?? title;
  }

  const [shorter, longer] = album.length <= title.length ? [album, title] : [title, album];

  return longer.toLowerCase().includes(shorter.toLowerCase()) ? shorter : album;
};

export { audiobookTitleOf };
