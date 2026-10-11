import { sendToRequests } from '@ValenceClient/requests/sendToRequests';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { z } from 'zod';

/**
 * Asks the server to do something to its live TV, and reads what came back.
 *
 * @param path - Where, under the live TV routes.
 * @param method - How.
 * @param schema - What a success answers with.
 * @param body - What to send.
 * @returns What it answered, or why it refused.
 */
const sendToLiveTv = <Value>(
  path: string,
  method: string,
  schema: z.ZodType<Value>,
  body?: object,
): Promise<Sent<Value | null>> =>
  sendToRequests(`/api/live${path}`, method, body, async (response) =>
    response.status === 204 ? null : schema.parse(await response.json()),
  );

export { sendToLiveTv };
