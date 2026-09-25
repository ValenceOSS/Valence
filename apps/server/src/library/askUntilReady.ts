import { wait } from '@ValenceCore/functions/wait';

type AskUntilReadyOptions<T> = {
  ask: () => Promise<T>;
  isCancelled: (() => boolean) | undefined;
};

const ASK_AGAIN_MILLISECONDS = 5_000;

const LOOK_FOR_A_STOP_MILLISECONDS = 250;

/**
 * Asks the media service about a render until it says the render is ready, giving up the moment the
 * job that wanted it is stopped.
 *
 * Nothing waits on the render itself: holding a request open for a whole encode left a stopped job
 * sitting in it until every render in flight had finished. Asking again every few seconds can be
 * given up between any two asks — and the wait between them is watched for a stop too, since a job
 * that took five seconds to notice it had been stopped read as one that had not.
 *
 * A render that fails says so: the media service remembers what went wrong and answers the next ask
 * with it, so this ends on a fault rather than on a clock.
 *
 * @param options - How to ask, and whether the job has been stopped.
 * @returns Whether the render is ready, which is false where the job was stopped.
 */
const askUntilReady = async <T extends { isReady: boolean }>({
  ask,
  isCancelled,
}: AskUntilReadyOptions<T>): Promise<boolean> => {
  let answer = await ask();

  while (!answer.isReady) {
    for (let waited = 0; waited < ASK_AGAIN_MILLISECONDS; waited += LOOK_FOR_A_STOP_MILLISECONDS) {
      if (isCancelled?.() === true) {
        return false;
      }

      await wait(LOOK_FOR_A_STOP_MILLISECONDS);
    }

    if (isCancelled?.() === true) {
      return false;
    }

    answer = await ask();
  }

  return true;
};

export { askUntilReady };
