const AGAIN_WITHIN_MS = 3000;

type Recoveries = {
  firstAtMs?: number;
  secondAtMs?: number;
};

/**
 * Whether to start a stream that failed again where it was, or give up on it, the way Jellyfin
 * recovers one: once, and once more where it fails again within three seconds, but not a third time
 * that quickly. A stream that fails now and then is recovered every time; one that fails as soon as
 * it is started again will not play.
 *
 * @param recoveries - When the stream was last started again, from nothing for a fresh stream.
 * @param nowMs - When it failed this time.
 * @returns Whether to start it again, and what to remember for next time where it is.
 */
const recoverOrGiveUp = (
  recoveries: Recoveries,
  nowMs: number,
): { shouldRecover: true; recoveries: Recoveries } | { shouldRecover: false } => {
  if (recoveries.firstAtMs === undefined || nowMs - recoveries.firstAtMs > AGAIN_WITHIN_MS) {
    return { shouldRecover: true, recoveries: { ...recoveries, firstAtMs: nowMs } };
  }

  if (recoveries.secondAtMs === undefined || nowMs - recoveries.secondAtMs > AGAIN_WITHIN_MS) {
    return { shouldRecover: true, recoveries: { ...recoveries, secondAtMs: nowMs } };
  }

  return { shouldRecover: false };
};

export type { Recoveries };

export { recoverOrGiveUp };
