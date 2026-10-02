import { timeoutManager } from '@tanstack/react-query';

/**
 * Lets a timer go on running without keeping the process alive for it.
 *
 * @param timer - The timer just set.
 * @returns The same timer.
 */
const unreferenced = <TTimer>(timer: TTimer): TTimer => {
  if (typeof timer === 'object' && timer !== null && 'unref' in timer) {
    const { unref } = timer;

    if (typeof unref === 'function') {
      unref.call(timer);
    }
  }

  return timer;
};

/**
 * Sets every timer the query cache sets so that it does not hold a test run open.
 *
 * A cache clears out what nobody is using after five minutes, on a timer set the moment data goes
 * in. A test that fills a cache and finishes leaves those timers behind, and Jest will not exit
 * while one is pending: the run finished in a minute and a half and then sat, finished, until the
 * last of them fired, and the push it was part of sat with it. The clearing out still happens
 * whenever a process lasts that long; it is only no longer a reason for one to last.
 */
const releaseQueryTimers = (): void => {
  timeoutManager.setTimeoutProvider({
    setTimeout: (callback, delay) => unreferenced(setTimeout(callback, delay)),
    clearTimeout: (timer) => {
      clearTimeout(timer);
    },
    setInterval: (callback, delay) => unreferenced(setInterval(callback, delay)),
    clearInterval: (timer) => {
      clearInterval(timer);
    },
  });
};

export { releaseQueryTimers };
