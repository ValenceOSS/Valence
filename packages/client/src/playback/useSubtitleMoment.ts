import { useEffect, useState } from 'react';
import type { SubtitleCue } from '@ValenceClient/playback/fetchSubtitleCues';

const MOST_AHEAD_SECONDS = 1;

/**
 * The moment to pick subtitle lines at, for a phone or a television whose player says where it is
 * only a few times a second.
 *
 * A line timed by those reports alone comes up late by as much as the gap between two of them, and
 * one shorter than the gap can fall between them and never be drawn at all. So while the film plays,
 * the moment steps on to the next line's start or end at the time it falls, worked out from the last
 * report, and never more than a second past it, so a stalled picture does not leave the words
 * running on without it.
 *
 * @param cues - Every line in the track.
 * @param position - Where the film is, in seconds, as the player last said.
 * @param isPlaying - Whether it is playing, which is when the moment moves on between reports.
 * @returns Where the film has got to, as far as the lines are concerned.
 */
const useSubtitleMoment = (
  cues: readonly SubtitleCue[],
  position: number,
  isPlaying: boolean,
): number => {
  const [told, setTold] = useState(position);
  const [reached, setReached] = useState(position);

  if (!Object.is(told, position)) {
    setTold(position);
    setReached(position);
  }

  useEffect(() => {
    if (!isPlaying) {
      return undefined;
    }

    const next = cues.reduce<number | null>((soonest, cue) => {
      const edge = cue.from > reached ? cue.from : cue.to > reached ? cue.to : null;

      return edge === null || (soonest !== null && soonest <= edge) ? soonest : edge;
    }, null);

    if (next === null || next - told > MOST_AHEAD_SECONDS) {
      return undefined;
    }

    const timer = setTimeout(
      () => {
        setReached(next);
      },
      (next - reached) * 1000,
    );

    return () => {
      clearTimeout(timer);
    };
  }, [cues, reached, told, isPlaying]);

  return reached;
};

export { useSubtitleMoment };
