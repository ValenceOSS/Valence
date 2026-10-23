import { shiftWebVtt } from '@ValenceCore/functions/shiftWebVtt';

type TimedPart = { content: string; offsetSeconds: number };

/**
 * Joins the WebVTT tracks of a film's parts into one track for the whole film, each part's cues
 * moved on by how long the parts before it play, and the first part's header kept.
 *
 * @param parts - Each part's track, in order, with where that part starts in the film.
 * @returns The one track.
 */
const joinWebVtt = (parts: readonly TimedPart[]): string => {
  const [first, ...later] = parts.map(({ content, offsetSeconds }) =>
    shiftWebVtt(content, -offsetSeconds).trim(),
  );
  const cues = later.flatMap((one) => {
    const blank = one.search(/\r?\n\r?\n/);

    return blank === -1 ? [] : [one.slice(blank).trim()];
  });

  return `${[first ?? 'WEBVTT', ...cues].join('\n\n')}\n`;
};

export type { TimedPart };

export { joinWebVtt };
