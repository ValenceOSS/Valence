import type { ConsoleLine } from '@ValenceContracts/schemas/ServiceConsole';

const KEPT_LINES = 500;

/**
 * The last few hundred lines this service has written to its console, kept so the Valence server
 * can show them beside its own on the Jobs and logs page rather than an operator having to read
 * the container's output.
 *
 * @param now - The clock.
 * @returns A window that is written to and read from.
 */
const createConsoleWindow = (now: () => number = Date.now) => {
  const lines: ConsoleLine[] = [];

  return {
    add: (message: string, level: ConsoleLine['level'] = 'info') => {
      lines.push({ atMs: now(), level, message });

      if (lines.length > KEPT_LINES) {
        lines.splice(0, lines.length - KEPT_LINES);
      }
    },
    read: (): ConsoleLine[] => [...lines],
  };
};

type ConsoleWindow = ReturnType<typeof createConsoleWindow>;

export type { ConsoleWindow };

export { createConsoleWindow };
