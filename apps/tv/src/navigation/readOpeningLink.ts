const OPENING = /^valence:\/\/open\/(film|show)\/([^/?#]+)/u;

/**
 * What a link into Valence from outside asks to open — the television's top shelf opens a title
 * this way — as whether it is a film or a programme, and which.
 *
 * @param link - The address Valence was opened at.
 * @returns What to open, or nothing where the link asks for nothing Valence knows.
 */
const readOpeningLink = (
  link: string | null,
): { kind: 'film' | 'show'; mediaId: string } | null => {
  const found = link === null ? null : OPENING.exec(link);
  const [, kind, mediaId] = found ?? [];

  if (mediaId === undefined || (kind !== 'film' && kind !== 'show')) {
    return null;
  }

  return { kind, mediaId: decodeURIComponent(mediaId) };
};

export { readOpeningLink };
