const MARKERS =
  /\bS\d{1,2}E\d{1,4}|\bS\d{1,2}\b|\bSeasons? ?\d|\b\d{1,2}x\d{2,3}\b|\b(2160|1080|720|576|480)[pi]\b|\b(4k|uhd|sd|remux|blu-?ray|web-?dl|web-?rip|webrip|web|hdtv|dvdrip|bdrip|brrip|x26[45]|h ?26[456]|hevc|av1|complete (?:series|collection|seasons?)|proper|repack|imax|extended|remastered|flac|mp3|320|v0|24 ?bit|\d{1,4}x\d{3,4})\b|\[|\(\d{2,4}-\d{2,4}\)|\(Episode\s|\s-\s?E?(?!(?:19|20)\d{2}\b)\d{2,4}\b/i;

const FANSUB_EPISODE = /(?<=\S\s)(?!(?:19|20)\d{2}\b)\d{2,4}(?=\s*(?:-\s*\d|&|\(|\[|$))/;

const YEARS = /(?:^|[\s(])((?:19|20)\d{2})(?=[\s)-]|$)/g;

/**
 * The title and year a release name gives before what it is made of.
 *
 * The year is the last one before the first marker of quality or episode, so a title that is
 * itself a number, such as `Blade Runner 2049 2017` or `1917 2019`, keeps it — unless the last two
 * make a span, such as `(2005 2013)` for a whole series or a film collection, when the first is its
 * year. A name that starts with its year keeps it as its title. A fansub group in brackets in front
 * is left out, and so is an anime episode's number and name after the title.
 *
 * @param spaced - The name, with its words spaced.
 * @returns The title, and the year where it gives one.
 */
const readTitle = (spaced: string): { title: string; year: number | null } => {
  const unprefixed = spaced.replace(/^\[[^\]]*\]\s*/, '');
  const markers = [
    unprefixed.search(MARKERS),
    spaced.startsWith('[') ? unprefixed.search(FANSUB_EPISODE) : -1,
  ].filter((at) => at !== -1);
  const markerAt = markers.length === 0 ? -1 : Math.min(...markers);
  const head = unprefixed.slice(0, markerAt === -1 ? unprefixed.length : Math.max(markerAt, 1));
  const years = [...head.matchAll(YEARS)].filter(
    (year) => year.index > 0 || year[0].startsWith('('),
  );
  const last = years.at(-1);
  const before = years.at(-2);
  const isSpan =
    before !== undefined &&
    last !== undefined &&
    Number(last[1]) >= Number(before[1]) &&
    /^[\s()-]*$/.test(head.slice(before.index + before[0].length, last.index)) &&
    before.index > 0;
  const chosen = isSpan ? before : last;
  const titleEnd = chosen?.index ?? head.length;
  const title = head
    .slice(0, titleEnd)
    .replace(/[\s([-]+$/, '')
    .trim();

  if (title === '') {
    const [whole] = head.trim().split(/\s(?=\()|\s-\s/);

    return { title: (whole ?? head).replace(/[()]/g, '').trim(), year: null };
  }

  return { title, year: chosen?.[1] === undefined ? null : Number(chosen[1]) };
};

export { readTitle };
