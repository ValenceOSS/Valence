import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aReport } from '@ValenceMetrics/testing/aReport';
import { recordReport } from './recordReport';
import { BODY_LIMIT, receiveReport } from './receiveReport';

vi.mock('@ValenceMetrics/db/openDatabase', () => ({ openDatabase: vi.fn(() => ({})) }));

vi.mock('./recordReport', () => ({ recordReport: vi.fn() }));

const posting = (body: string) =>
  new Request('http://metrics.test/api/v1/reports', { method: 'POST', body });

describe('receiveReport', () => {
  beforeEach(() => {
    vi.mocked(recordReport).mockReset();
  });

  it('keeps a report that keeps to the contract', async () => {
    vi.mocked(recordReport).mockResolvedValue('recorded');

    const response = await receiveReport(posting(JSON.stringify(aReport())));

    expect(response.status).toBe(202);
    expect(vi.mocked(recordReport).mock.calls[0]?.[1]).toStrictEqual(aReport());
  });

  it('turns away a body that is not a report', async () => {
    const response = await receiveReport(
      posting(JSON.stringify({ ...aReport(), installId: 'not-a-uuid' })),
    );

    expect(response.status).toBe(400);
    expect(await response.json()).toHaveProperty('error');
    expect(recordReport).not.toHaveBeenCalled();
  });

  it('turns away a body that is not JSON', async () => {
    const response = await receiveReport(posting('{'));

    expect(response.status).toBe(400);
    expect(await response.json()).toStrictEqual({ error: 'The body is not JSON.' });
  });

  it('turns away a body too long to be a report', async () => {
    const response = await receiveReport(posting('x'.repeat(BODY_LIMIT + 1)));

    expect(response.status).toBe(413);
  });

  it('turns away a second report inside the hour', async () => {
    vi.mocked(recordReport).mockResolvedValue('tooSoon');

    const response = await receiveReport(posting(JSON.stringify(aReport())));

    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('3600');
  });
});
