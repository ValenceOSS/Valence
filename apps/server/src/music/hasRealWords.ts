const ADVERT = /(https?:\/\/|www\.|t\.me\/|\.(?:com|net|org|ru|io)\b)/i;

const TIMING = /^\s*(?:\[[^\]]*\]\s*)+/;

/**
 * Whether what a file keeps as its lyrics is a song's words, rather than the web address a ripper
 * wrote into the field to advertise where the file came from — which, drawn as lyrics, is a page
 * of one line saying where to download more music.
 *
 * @param text - What the file keeps as its lyrics.
 * @returns Whether it is words worth showing.
 */
const hasRealWords = (text: string): boolean => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.replace(TIMING, '').trim())
    .filter((line) => line !== '');

  return lines.length > 0 && !lines.every((line) => ADVERT.test(line));
};

export { hasRealWords };
