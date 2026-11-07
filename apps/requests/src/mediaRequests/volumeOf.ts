const NUMBERED = /^(.*?)[\s,:;.\-–]*\b(?:vol(?:ume)?)\.?\s*(\d{1,3})\b/iu;

const EDITION = /\s*\(?(?:[\p{L}\p{N}-]+\s+)?edition\)?\s*$/iu;

/**
 * Which volume of a series a book is, where its title says so, as a volume of a manga or a comic
 * is listed — `Chainsaw Man, Vol. 10`, or `Vagabond (VIZBIG Edition), Vol. 3` — with the series'
 * name as it would be searched for: without the edition, or the punctuation before the number.
 *
 * @param title - The book's title.
 * @returns The series and the volume, or null where the title names no volume.
 */
const volumeOf = (title: string): { series: string; volume: number } | null => {
  const found = NUMBERED.exec(title);
  const series = (found?.[1] ?? '')
    .replace(EDITION, '')
    .replace(/[\s,:;.\-–]+$/u, '')
    .trim();
  const volume = Number(found?.[2]);

  return found === null || series === '' || !Number.isInteger(volume) || volume < 1
    ? null
    : { series, volume };
};

export { volumeOf };
