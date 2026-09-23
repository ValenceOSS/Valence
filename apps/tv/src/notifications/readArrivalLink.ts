const ARRIVAL = /[?&](item|show)=([^&]+)/u;

/**
 * Where a notice that something has arrived points: the film, or the programme, the server links
 * it to, as the web's own addresses name them.
 *
 * @param link - The notice's link, such as `/?item=…` for a film or `/?show=…` for a programme.
 * @returns Whether it is a film or a programme and which, or nothing where it points elsewhere.
 */
const readArrivalLink = (
  link: string | null,
): { kind: 'film' | 'show'; mediaId: string } | null => {
  const found = link === null ? null : ARRIVAL.exec(link);
  const [, named, mediaId] = found ?? [];

  if (named === undefined || mediaId === undefined) {
    return null;
  }

  return { kind: named === 'item' ? 'film' : 'show', mediaId: decodeURIComponent(mediaId) };
};

export { readArrivalLink };
