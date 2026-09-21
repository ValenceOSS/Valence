import { logLineAsText } from './logLineAsText';
import type { LogRecord } from '@ValenceContracts/schemas/Log';

const WARNING = [
  '# Valence log export',
  '# These lines quote file paths, which disclose the layout of the library and the',
  '# titles on the disk. Read what you are about to send before sending it.',
  '',
].join('\n');

/**
 * Turns the records on screen into something worth pasting into a bug report.
 *
 * Oldest first, which is the order somebody reads a story in, rather than the newest-first order the
 * panel shows. Repeats say how many times they happened rather than being written out again.
 *
 * It opens with a warning about file paths. Those are not stripped — they are most of what makes a
 * scan log useful, and a log without them would not be worth exporting — so the honest thing is to
 * say plainly what is in the file before somebody sends it somewhere.
 *
 * @param records - What the panel is showing.
 * @returns The text to copy or download.
 */
const logsAsText = (records: readonly LogRecord[]): string =>
  `${WARNING}${[...records]
    .sort((one, other) => one.atMs - other.atMs)
    .map(logLineAsText)
    .join('\n')}\n`;

export { logsAsText };
