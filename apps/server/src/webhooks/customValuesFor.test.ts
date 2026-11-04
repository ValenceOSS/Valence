import { describe, expect, it } from 'vitest';
import { customValuesFor } from './customValuesFor';
import { WEBHOOK_PAYLOAD_VERSION } from '@ValenceContracts/schemas/Webhook';
import type { WebhookPayload } from '@ValenceContracts/schemas/Webhook';

const FAILED: WebhookPayload = {
  version: WEBHOOK_PAYLOAD_VERSION,
  id: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  occurredAt: '2026-08-14T20:00:00.000Z',
  event: 'job.failed',
  data: {
    kind: 'library.scan',
    label: 'Scan for changes',
    jobId: 'job-1',
    subject: 'library-1',
    subjectName: 'Films',
    reason: 'no space left',
  },
};

const BRAND = { name: 'Flux', url: 'https://flux.example.com', iconUrl: null, accent: null };

describe('customValuesFor', () => {
  it('names the event, when it happened and which server sent it', () => {
    expect(customValuesFor(FAILED, BRAND)).toMatchObject({
      event: 'job.failed',
      eventLabel: 'Job failed',
      id: FAILED.id,
      occurredAt: FAILED.occurredAt,
      server: { name: 'Flux', url: 'https://flux.example.com' },
    });
  });

  it('gives the same headline and urgency every other service is sent, and the problem as detail', () => {
    const values = customValuesFor(FAILED, BRAND);

    expect(values).toMatchObject({ urgent: true, tone: 'failure' });
    expect(JSON.stringify(values)).toContain('no space left');
  });

  it('carries the event’s own data as a Generic webhook gets it', () => {
    expect(customValuesFor(FAILED, BRAND)).toMatchObject({ data: FAILED.data });
  });

  it('says a test delivery in a line', () => {
    const values = customValuesFor({ ...FAILED, event: 'webhook.test', data: {} }, BRAND);

    expect(values).toMatchObject({ event: 'webhook.test', urgent: false, link: null });
    expect(values).toHaveProperty('summary', expect.any(String));
  });
});
