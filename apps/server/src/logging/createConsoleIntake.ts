import type { ConsoleLine } from '@ValenceContracts/schemas/ServiceConsole';
import type { LogSource } from '@ValenceContracts/schemas/Log';
import type { Logger } from './Logger';

/**
 * Copies what another of Valence's services wrote to its console into the server's own log, under
 * that service's name, so everything the containers print can be read on the Jobs and logs page.
 * The service sends its last few hundred lines every time it is asked, so only those newer than the
 * last line taken are kept.
 *
 * @param log - Where the lines are written.
 * @param source - Which service they came from.
 * @returns What to hand each reading to.
 */
const createConsoleIntake = (log: Logger, source: LogSource) => {
  let takenUpToMs = 0;

  return {
    take: (lines: readonly ConsoleLine[]) => {
      const fresh = lines
        .filter((line) => line.atMs > takenUpToMs)
        .sort((one, other) => one.atMs - other.atMs);

      for (const line of fresh) {
        log[line.level](source, line.message, { isQuiet: true });
      }

      takenUpToMs = fresh.reduce((newest, line) => Math.max(newest, line.atMs), takenUpToMs);
    },
  };
};

export { createConsoleIntake };
