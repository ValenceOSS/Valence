/**
 * Moves a score kept before subtitles were scored as Bazarr scores them — a minimum, or what a
 * subtitle kept then scored — onto that scale, keeping what it meant: the exact file only stays at
 * 100, the same release becomes 98, a close match becomes 90, which asks for the same source, and
 * anything stays at nothing. A score below a close match becomes Bazarr's own default minimum for
 * its kind.
 *
 * @param old - The score as it was kept.
 * @param kind - Whether it is for films or episodes.
 * @returns The score on Bazarr's scale.
 */
const bazarrMinimumOf = (old: number, kind: 'film' | 'episode'): number =>
  old >= 100 ? 100 : old >= 80 ? 98 : old >= 60 ? 90 : old > 0 ? (kind === 'film' ? 70 : 90) : 0;

export { bazarrMinimumOf };
