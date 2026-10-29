import type { TelemetryReport } from '@ValenceContracts/schemas/TelemetryReport';

const GIVES_UP_AFTER_MS = 10_000;

type SendTelemetryReportOptions = {
  address: string;
  report: TelemetryReport;
  version: string;
  fetch?: typeof globalThis.fetch;
};

type SendOutcome = { isSent: true } | { isSent: false; problem: string };

/**
 * Posts one anonymous report to the metrics server, once, giving up after ten seconds. A failure is
 * told back rather than thrown, since nothing waits on the report arriving.
 *
 * @param options - Where to send it, the report, this release, and how to fetch.
 * @returns Whether it arrived, and where it did not, the status it was answered with or the error.
 */
const sendTelemetryReport = async ({
  address,
  report,
  version,
  fetch = globalThis.fetch,
}: SendTelemetryReportOptions): Promise<SendOutcome> => {
  try {
    const response = await fetch(address, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': `Valence/${version}` },
      body: JSON.stringify(report),
      signal: AbortSignal.timeout(GIVES_UP_AFTER_MS),
    });

    await response.body?.cancel().catch(() => undefined);

    return response.ok ? { isSent: true } : { isSent: false, problem: response.status.toString() };
  } catch (error) {
    return { isSent: false, problem: error instanceof Error ? error.message : String(error) };
  }
};

export type { SendOutcome };

export { sendTelemetryReport };
