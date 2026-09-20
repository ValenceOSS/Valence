import { watchJobs } from '@ValenceClient/admin/fetchAdmin';
import { resumeRunning } from '@ValenceScreens/components/AdminArea/scanCoordinator';

/**
 * Keeps the page showing every job the server is running, including ones nobody on this page asked
 * for: those already going when it opened, and those the server starts on its own, such as the
 * previews and scrub images a scan queues once it is done.
 *
 * @returns The function that stops following.
 */
const followRunningJobs = (): (() => void) => {
  void resumeRunning();

  return watchJobs((event) => {
    if (event.event === 'started') {
      void resumeRunning();
    }
  });
};

export { followRunningJobs };
