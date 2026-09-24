type InTimeOptions<T> = {
  failure: () => Error;
  onLate?: () => void;
  discard?: (late: T) => void;
};

/**
 * Gives up on a task that runs past its time: says so to whatever it was using, and disposes of
 * what it gives if it gives it after all, so nothing that arrives late is left open.
 *
 * @param task - The task.
 * @param ms - How long it has.
 * @param failure - What to fail with when its time runs out.
 * @param onLate - Called when its time runs out, to stop it where it stands.
 * @param discard - Called with what it gives if it gives it too late.
 * @returns What it gave, if it gave it in time.
 */
const inTime = async <T>(
  task: Promise<T>,
  ms: number,
  { failure, onLate = () => {}, discard = () => {} }: InTimeOptions<T>,
): Promise<T> => {
  let handle: NodeJS.Timeout | undefined;
  let isLate = false;

  void task.then(
    (value) => {
      if (isLate) {
        discard(value);
      }
    },
    () => {},
  );

  try {
    return await Promise.race([
      task,
      new Promise<never>((_, reject) => {
        handle = setTimeout(() => {
          isLate = true;
          onLate();
          reject(failure());
        }, ms);
      }),
    ]);
  } finally {
    clearTimeout(handle);
  }
};

export { inTime };
