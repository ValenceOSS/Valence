/**
 * Builds a scheduler that holds the work handed to it and runs all of it together, a short while
 * after the first piece arrives, so that many answers arriving close together are passed on in one
 * go and whatever draws them draws once rather than once for each.
 *
 * @param everyMs - How long to hold the first piece of work for the rest to join it, in milliseconds.
 * @returns The scheduler.
 */
const gatheredScheduler = (everyMs: number): ((work: () => void) => void) => {
  let held: (() => void)[] = [];

  return (work) => {
    held.push(work);

    if (held.length > 1) {
      return;
    }

    setTimeout(() => {
      const due = held;

      held = [];

      for (const one of due) {
        one();
      }
    }, everyMs);
  };
};

export { gatheredScheduler };
