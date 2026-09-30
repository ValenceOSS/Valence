import type { DecodedSubtitle } from './decodeSubtitle';
import type { Said } from '@ValenceI18n/SaidSchema';
import { saying } from '@ValenceI18n/saying';

/**
 * Says what a subtitle file was read as and what decided that, for the files where anything was
 * guessed at all.
 *
 * A file read as UTF-8 is not worth reporting: either it said so with a byte order mark or it proved
 * it by decoding cleanly, and in both cases nothing was assumed. Everything else was a decision
 * Valence made on the file's behalf, and a wrong one shows up as mojibake with nothing else to
 * explain it — so the decision is said out loud where an operator can see it.
 *
 * @param decoded - What the file was read as.
 * @returns What to report, or null where nothing was guessed.
 */
const describeSubtitleCharset = (decoded: DecodedSubtitle): Said | null => {
  if (decoded.decidedBy === 'bom' || decoded.decidedBy === 'utf8') {
    return null;
  }

  const why =
    decoded.decidedBy === 'language'
      ? saying('server.subtitles.describeSubtitleCharset.fromTheTrackLanguage')
      : saying('server.subtitles.describeSubtitleCharset.aGuessSinceTheFileDoes');

  return saying('server.subtitles.describeSubtitleCharset.readAsCharsetWhyNotValid', {
    charset: decoded.charset,
    why,
  });
};

export { describeSubtitleCharset };
