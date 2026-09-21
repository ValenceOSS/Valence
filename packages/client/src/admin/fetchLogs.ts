import { LogPageSchema, LogRecordSchema } from '@ValenceContracts/schemas/Log';
import { postForLogs } from './postForLogs';
import { getRealtimeClient } from '@ValenceClient/realtime/getRealtimeClient';
import type { LogQuery, LogRecord } from '@ValenceContracts/schemas/Log';
import type { RealtimeClient } from '@ValenceClient/realtime/createRealtimeClient';

type Subscribes = Pick<RealtimeClient, 'subscribe'>;

type LogPage = { records: LogRecord[]; total: number };

const NOTHING: LogPage = { records: [], total: 0 };

/**
 * Reads the log, filtered.
 *
 * Answers with nothing rather than throwing when the server refuses or cannot be reached, since a
 * panel that has lost the connection should say it is empty and carry on rather than take the page
 * down with it.
 *
 * @param query - What to look for.
 * @returns The records that matched, newest first.
 */
const fetchLogs = (query: Partial<LogQuery>): Promise<LogPage> =>
  postForLogs('/api/admin/logs', query, LogPageSchema, NOTHING);

/**
 * Follows the log as it is written, over the connection the rest of the app already has.
 *
 * @param onRecord - Told about each record as it is written.
 * @param client - The connection to watch over, which is the shared one unless a test says otherwise.
 * @returns The function that stops watching.
 */
const watchLogs = (
  onRecord: (record: LogRecord) => void,
  client: Subscribes = getRealtimeClient(),
): (() => void) =>
  client.subscribe('logs', (event) => {
    const read = LogRecordSchema.safeParse(event.payload);

    if (read.success) {
      onRecord(read.data);
    }
  });

export type { LogPage };

export { fetchLogs, watchLogs };
