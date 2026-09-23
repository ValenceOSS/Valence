import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';

/**
 * The lines that belong on screen at a moment.
 *
 * More than one can be showing at once: a film that names its speaker keeps that line up while the
 * speech under it changes, and a sign painted over the picture stays while somebody talks. Taking
 * only the first would drop one of them.
 *
 * @param cues - Every line in the track.
 * @param atSeconds - Where the film has got to.
 * @returns The lines to draw, in the order they were written.
 */
const theCueAt = (cues: readonly SubtitleCue[], atSeconds: number): SubtitleCue[] =>
  cues.filter((cue) => atSeconds >= cue.from && atSeconds < cue.to);

export { theCueAt };
