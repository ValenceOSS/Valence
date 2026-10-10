/**
 * Makes a way to do work one piece at a time for each key, in the order it was asked for, while
 * work for different keys goes on alongside.
 *
 * @returns What does a piece of work for a key once that key's earlier work is done, and answers
 *   with what the work came to.
 */
const createTurns = () => {
  const running = new Map<string, Promise<void>>();

  return <Result>(key: string, work: () => Promise<Result>): Promise<Result> => {
    const next = (running.get(key) ?? Promise.resolve()).then(work, work);
    const settled = next.then(
      () => undefined,
      () => undefined,
    );

    running.set(key, settled);
    void settled.then(() => {
      if (running.get(key) === settled) {
        running.delete(key);
      }
    });

    return next;
  };
};

export { createTurns };
