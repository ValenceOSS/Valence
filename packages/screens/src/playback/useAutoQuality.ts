import { useEffect, useRef } from 'react';
import { decideAutoQuality } from '@ValenceClient/playback/decideAutoQuality';
import type { AutoRung } from '@ValenceClient/playback/decideAutoQuality';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';
import type { RefObject } from 'react';

const STALL_WINDOW_MILLISECONDS = 60_000;

const SETTLING_AFTER_A_START_MILLISECONDS = 5000;

const SETTLING_AFTER_A_SEEK_MILLISECONDS = 2000;

const CHECK_EVERY_MILLISECONDS = 5000;

type AutoQualityOptions = {
  isOn: boolean;
  videoRef: RefObject<HTMLVideoElement | null>;
  readEstimatedKbps: () => number | null;
  current: AutoRung;
  steps: readonly QualityStepId[];
  sourceBitrateKbps: number | null;
  onChange: (rung: AutoRung) => void;
};

/**
 * Watches a stream left on auto and moves it to another rung when the connection is not keeping up,
 * or has room to spare. A stall counts only once playback has settled: the wait at the start and the
 * wait after a seek are the stream being fetched, not the connection falling behind.
 *
 * @param options - Whether auto is on, the element playing, the engine's estimate of the connection,
 *   the rung playing and those on offer, what the file runs at, and what to do with a new rung.
 */
const useAutoQuality = ({
  isOn,
  videoRef,
  readEstimatedKbps,
  current,
  steps,
  sourceBitrateKbps,
  onChange,
}: AutoQualityOptions): void => {
  const latest = useRef({ readEstimatedKbps, steps, sourceBitrateKbps, onChange });

  useEffect(() => {
    latest.current = { readEstimatedKbps, steps, sourceBitrateKbps, onChange };
  });

  useEffect(() => {
    const element = videoRef.current;

    if (!isOn || element === null) {
      return;
    }

    const startedAt = Date.now();
    let seekedAt = 0;
    let stalls: number[] = [];
    let steadySince = startedAt;
    let hasMoved = false;

    const onSeeking = () => {
      seekedAt = Date.now();
    };

    const onWaiting = () => {
      const now = Date.now();

      if (
        element.seeking ||
        now - startedAt < SETTLING_AFTER_A_START_MILLISECONDS ||
        now - seekedAt < SETTLING_AFTER_A_SEEK_MILLISECONDS
      ) {
        return;
      }

      stalls = [...stalls, now];
      steadySince = now;
    };

    const check = () => {
      if (hasMoved || element.paused) {
        return;
      }

      const now = Date.now();

      stalls = stalls.filter((at) => now - at < STALL_WINDOW_MILLISECONDS);

      const next = decideAutoQuality({
        current,
        steps: latest.current.steps,
        sourceBitrateKbps: latest.current.sourceBitrateKbps,
        estimatedKbps: latest.current.readEstimatedKbps(),
        stallsLately: stalls.length,
        steadySeconds: (now - steadySince) / 1000,
      });

      if (next !== null) {
        hasMoved = true;
        latest.current.onChange(next);
      }
    };

    element.addEventListener('seeking', onSeeking);
    element.addEventListener('waiting', onWaiting);

    const timer = setInterval(check, CHECK_EVERY_MILLISECONDS);

    return () => {
      element.removeEventListener('seeking', onSeeking);
      element.removeEventListener('waiting', onWaiting);
      clearInterval(timer);
    };
  }, [isOn, videoRef, current]);
};

export { useAutoQuality };
