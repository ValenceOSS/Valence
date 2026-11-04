import { isDeadlock } from '@ValenceDatabase/isDeadlock';

const ATTEMPTS = 3;

/**
 * Runs a write again where MySQL chose it as the loser of a deadlock, as an edit can be while a
 * scan writes the same files, giving up after a few tries; any other failure is thrown at once.
 *
 * @param write - The write.
 * @returns What the write gave back.
 */
const retryingDeadlocks = async <T>(write: () => Promise<T>): Promise<T> => {
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await write();
    } catch (error) {
      if (attempt >= ATTEMPTS || !isDeadlock(error)) {
        throw error;
      }
    }
  }
};

export { retryingDeadlocks };
