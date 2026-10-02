const realSetTimeout = globalThis.setTimeout;

/**
 * Waits for the work a component left to do as it unmounted, so it runs while the test that
 * unmounted it still has a page to do it on.
 *
 * Radix's focus scope, inside every dialog, hands focus back from a timer it sets as it unmounts.
 * After a file's last test the page is taken away straight after cleanup, and that timer then
 * dispatches its event into nothing and throws. Every test in the file has passed, and the run
 * still fails, on whichever file happened to be last on a busy machine.
 *
 * Waits on the timer that was there when this loaded rather than whatever is there now, so a test
 * that left fake timers running does not leave this waiting on a clock nobody advances.
 *
 * @returns Once one turn of the timers has run.
 */
const letUnmountingFinish = (): Promise<void> =>
  new Promise((resolve) => {
    realSetTimeout(resolve, 0);
  });

export { letUnmountingFinish };
