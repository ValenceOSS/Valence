import { SUBTITLE_STEP_SECONDS } from '@ValenceClient/playback/SUBTITLE_STEP_SECONDS';

const FURTHEST_NUDGE = 6;

const SUBTITLE_NUDGES: readonly number[] = Array.from(
  { length: FURTHEST_NUDGE * 2 + 1 },
  (_, at) => (at - FURTHEST_NUDGE) * SUBTITLE_STEP_SECONDS,
);

export { SUBTITLE_NUDGES };
