import { appendFile } from 'node:fs/promises';
import { join } from 'node:path';

/**
 * Writes down what the updater did, a line at a time, in `updates.log` beside this client's other
 * files.
 *
 * An update that never arrives says nothing on its own. A release came out, the installer reached the
 * disk, and nobody was asked — and with every failure swallowed there was nothing on the machine to
 * say which step it stopped at. This is that record: each check, what it found, the download and how
 * it ended, and anything that went wrong, in the updater's own words as well as ours.
 *
 * Lines are written in the order they were said, one after another, and a line that cannot be
 * written is dropped rather than taking the updater down with it.
 *
 * @param folder - Where this client keeps its files.
 * @returns The way to write a line.
 */
const theUpdateLog = (folder: string): ((line: string) => void) => {
  const file = join(folder, 'updates.log');
  let writing: Promise<void> = Promise.resolve();

  return (line) => {
    const stamped = `${new Date().toISOString()} ${line}\n`;

    writing = writing.then(() => appendFile(file, stamped)).catch(() => undefined);
  };
};

export { theUpdateLog };
