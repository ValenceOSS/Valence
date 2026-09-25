import { say } from '@ValenceI18n/say';

const UNSAFE = /[^\p{L}\p{N} ()'.,&!-]+/gu;

const NOT_PLAIN = /[^\x20-\x7e]/gu;

/**
 * The header that has a browser save a prepared file under what it is called rather than open it.
 *
 * Both spellings are given, since a browser takes the encoded one and anything older takes the
 * plain one: a title in any script survives in the first, and the second is the same title with
 * whatever plain text cannot hold taken out.
 *
 * @param title - What the film or episode is called.
 * @returns The value of a `Content-Disposition` header.
 */
const asAnAttachment = (title: string): string => {
  const cleaned =
    title.replace(UNSAFE, ' ').replace(/\s+/gu, ' ').trim() || say('server.downloads.fallbackName');
  const plain =
    cleaned.replace(NOT_PLAIN, '').replace(/\s+/gu, ' ').trim() ||
    say('server.downloads.fallbackName');

  return `attachment; filename="${plain}.mp4"; filename*=UTF-8''${encodeURIComponent(`${cleaned}.mp4`)}`;
};

export { asAnAttachment };
