import type { LogRecord } from '@ValenceContracts/schemas/Log';

const describeContext = (record: LogRecord): string => {
  const said = Object.entries(record.context)
    .filter((entry): entry is [string, string] => entry[1] !== null)
    .map(([name, value]) => `${name}=${value}`);

  return said.length === 0 ? '' : ` (${said.join(' ')})`;
};

/**
 * One record as a line of text worth pasting: when, how serious, where from, what it said, how often
 * it happened and every identifier it carries, with any detail indented beneath.
 *
 * @param record - The record.
 * @returns The line.
 */
const logLineAsText = (record: LogRecord): string => {
  const stamp = new Date(record.atMs).toISOString();
  const repeated = record.count > 1 ? ` [x${record.count.toString()}]` : '';
  const detail = record.detail === null ? '' : `\n    ${record.detail.replaceAll('\n', '\n    ')}`;

  return `${stamp} ${record.level.toUpperCase().padEnd(5)} ${record.source}: ${record.message}${repeated}${describeContext(record)}${detail}`;
};

export { logLineAsText };
