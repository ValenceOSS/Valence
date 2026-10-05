import { appendFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { app } from 'electron';

const EVERY_MS = 5 * 60 * 1000;

const LARGEST_BYTES = 1024 * 1024;

const KIB = 1024;

/**
 * One line of the memory log: the time, then each of the app's processes by kind and process id,
 * with the memory it holds in megabytes.
 *
 * @returns The line.
 */
const aReading = (): string => {
  const processes = app
    .getAppMetrics()
    .map(
      (one) =>
        `${one.type}:${one.pid.toString()}=${Math.round(one.memory.workingSetSize / KIB).toString()}MB`,
    )
    .join(' ');

  return `${new Date().toISOString()} ${processes}\n`;
};

/**
 * Writes down how much memory each of the app's processes holds, every five minutes, to
 * `memory.log` in the app's own folder. A report of the app growing can then say which process grew
 * and when, which decides where a leak is looked for. The log starts again once it passes a
 * megabyte, so it never grows without limit itself.
 *
 * @returns A way to stop recording.
 */
const recordMemoryUse = (): (() => void) => {
  const file = join(app.getPath('userData'), 'memory.log');

  const record = () => {
    const size = (() => {
      try {
        return statSync(file).size;
      } catch {
        return 0;
      }
    })();

    if (size > LARGEST_BYTES) {
      writeFileSync(file, '');
    }

    appendFileSync(file, aReading());
  };

  record();

  const timer = setInterval(record, EVERY_MS);

  return () => {
    clearInterval(timer);
  };
};

export { recordMemoryUse };
