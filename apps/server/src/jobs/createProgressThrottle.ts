import type { Cancel, Schedule } from '@ValenceServer/realtime/createCoalescer';

type Throttled<T> = {
  offer: (jobId: string, progress: T) => void;
  forget: (jobId: string) => void;
};

type Waiting<T> = { progress: T; cancel: Cancel };

/**
 * Passes a job's progress on at most once in each interval, the latest reading winning, and the
 * last one arriving once the interval is up, unless the job has finished by then and said so itself.
 *
 * A job reports as often as it likes: the image cache sweep reports once for every file, which is
 * tens of thousands of reports in a few seconds every Sunday, and each one was a write to the job
 * history and a frame to every admin's socket, with requests waiting behind the writes. Nobody can
 * read a counter faster than this anyway.
 *
 * @param options - How long to leave between readings, the clock, how to wait, and where a reading
 *   goes.
 * @returns How to offer a reading, and how to drop what a finished job left waiting.
 */
const createProgressThrottle = <T>({
  everyMs,
  now,
  schedule,
  pass,
}: {
  everyMs: number;
  now: () => number;
  schedule: Schedule;
  pass: (progress: T) => void;
}): Throttled<T> => {
  const sentAt = new Map<string, number>();
  const waiting = new Map<string, Waiting<T>>();

  const send = (jobId: string, progress: T) => {
    sentAt.set(jobId, now());
    pass(progress);
  };

  return {
    offer: (jobId, progress) => {
      const last = sentAt.get(jobId);
      const held = waiting.get(jobId);

      if (held !== undefined) {
        waiting.set(jobId, { progress, cancel: held.cancel });

        return;
      }

      if (last === undefined || now() - last >= everyMs) {
        send(jobId, progress);

        return;
      }

      const cancel = schedule(
        () => {
          const latest = waiting.get(jobId);

          waiting.delete(jobId);

          if (latest !== undefined) {
            send(jobId, latest.progress);
          }
        },
        everyMs - (now() - last),
      );

      waiting.set(jobId, { progress, cancel });
    },

    forget: (jobId) => {
      waiting.get(jobId)?.cancel();
      waiting.delete(jobId);
      sentAt.delete(jobId);
    },
  };
};

export { createProgressThrottle };
