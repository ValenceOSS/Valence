const EAST_ASIAN = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u;

const NUMBERED = /^(.*?)[\s(（[【]*(?:第\s*)?(\d{1,3})\s*(?:巻|권|册|冊)?[\s)）\]】]*$/u;

/**
 * The series and volume of a manga volume whose title is in Japanese, Chinese or Korean and ends in
 * its number — "薫る花は凛と咲く 1", "ワンピース(3)" or "進撃の巨人 第2巻" — or nothing for any other
 * title, since one in English already says which volume it is in a way the rest of Valence reads.
 *
 * @param title - The title, as the catalogue gives it.
 * @returns The series and the volume, or nothing.
 */
const mangaVolumeOf = (title: string): { series: string; volume: number } | null => {
  const plain = title.normalize('NFKC').trim();

  if (!EAST_ASIAN.test(plain)) {
    return null;
  }

  const found = NUMBERED.exec(plain);
  const series = found?.[1]?.trim() ?? '';
  const volume = Number(found?.[2]);

  return found === null || series === '' || !Number.isInteger(volume) || volume < 1
    ? null
    : { series, volume };
};

export { mangaVolumeOf };
