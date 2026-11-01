const URI = /URI="([^"]+)"/u;

const SUBTITLES = /,SUBTITLES="[^"]*"/u;

/**
 * Rewrites one of YouTube's HLS playlists for a trailer to be played through this server: every
 * address in it is put through the server, and a master playlist keeps only its H.264 pictures,
 * which every phone, television and browser plays, and its sound, leaving out its subtitles,
 * since a trailer behind a title plays without them.
 *
 * @param text - The playlist.
 * @param base - Where it was read from, against which an address in it is read.
 * @param addressOf - Where the server serves an address, and whether that is a playlist.
 * @returns The playlist as the server serves it.
 */
const rewritePlaylist = (
  text: string,
  base: string,
  addressOf: (url: string, isPlaylist: boolean) => string,
): string => {
  const isMaster = text.includes('#EXT-X-STREAM-INF');
  const kept: string[] = [];
  let isSkippingNext = false;
  let isNextAPlaylist = false;

  for (const line of text.split('\n')) {
    const trimmed = line.trim();

    if (trimmed === '') {
      continue;
    }

    if (!trimmed.startsWith('#')) {
      if (isSkippingNext) {
        isSkippingNext = false;

        continue;
      }

      kept.push(addressOf(new URL(trimmed, base).href, isMaster || isNextAPlaylist));
      isNextAPlaylist = false;

      continue;
    }

    if (isMaster && trimmed.startsWith('#EXT-X-MEDIA:') && trimmed.includes('TYPE=SUBTITLES')) {
      continue;
    }

    if (isMaster && trimmed.startsWith('#EXT-X-STREAM-INF:')) {
      if (!/CODECS="avc1/u.test(trimmed)) {
        isSkippingNext = true;

        continue;
      }

      kept.push(trimmed.replace(SUBTITLES, ''));
      isNextAPlaylist = true;

      continue;
    }

    const uri = URI.exec(trimmed)?.[1];

    kept.push(
      uri === undefined
        ? trimmed
        : trimmed.replace(URI, `URI="${addressOf(new URL(uri, base).href, isMaster)}"`),
    );
  }

  return `${kept.join('\n')}\n`;
};

export { rewritePlaylist };
