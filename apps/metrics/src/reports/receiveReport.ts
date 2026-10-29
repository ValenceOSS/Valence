import { z } from 'zod';
import { TelemetryReportSchema } from '@ValenceContracts/schemas/TelemetryReport';
import { openDatabase } from '@ValenceMetrics/db/openDatabase';
import { readCappedBody } from './readCappedBody';
import { recordReport } from './recordReport';

const BODY_LIMIT = 16 * 1024;

/**
 * Reads a body as a report, or says why it is not one.
 *
 * @param body - The body, as text.
 * @returns The report, or what is wrong with it.
 */
const reportOf = (body: string) => {
  try {
    const parsed = TelemetryReportSchema.safeParse(JSON.parse(body));

    return parsed.success
      ? { report: parsed.data, error: null }
      : { report: null, error: z.prettifyError(parsed.error) };
  } catch {
    return { report: null, error: 'The body is not JSON.' };
  }
};

/**
 * Takes one server's daily report: checks it against the contract, turns away a second report from
 * the same install inside the hour, and keeps the rest.
 *
 * @param request - The report, as it arrived.
 * @returns 202 once it is kept, 400 for something that is not a report, 413 for one too long to
 *   be one, and 429 for one that came too soon after the last.
 */
const receiveReport = async (request: Request): Promise<Response> => {
  const body = await readCappedBody(request, BODY_LIMIT);

  if (body === null) {
    return Response.json({ error: 'The report is longer than 16 KB.' }, { status: 413 });
  }

  const { report, error } = reportOf(body);

  if (report === null) {
    return Response.json({ error }, { status: 400 });
  }

  const outcome = await recordReport(openDatabase(), report, new Date());

  if (outcome === 'tooSoon') {
    return Response.json(
      { error: 'This install has already reported in the last hour.' },
      { status: 429, headers: { 'Retry-After': '3600' } },
    );
  }

  return new Response(null, { status: 202 });
};

export { BODY_LIMIT, receiveReport };
