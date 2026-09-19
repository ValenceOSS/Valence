import { describe, expect, it, vi } from 'vitest';
import { createRequestsClient } from './createRequestsClient';

const A_SECRET = 'a-secret-long-enough-to-be-worth-keeping';

const A_STATUS = {
  version: '0.4.0',
  vpn: {
    isConfigured: false,
    isUp: null,
    publicAddress: null,
    country: null,
    checkedAt: null,
    problem: null,
  },
  indexers: { total: 0, enabled: 0, failing: [] },
};

/**
 * The service, answering the one way asked.
 */
const answering = (status: number, body: object) =>
  vi.fn(() => Promise.resolve(new Response(JSON.stringify(body), { status })));

describe('createRequestsClient', () => {
  it('reads what the service says about itself, presenting the secret', async () => {
    const fetch = answering(200, A_STATUS);
    const client = createRequestsClient({
      address: 'http://requests:8421',
      secret: A_SECRET,
      fetch,
    });

    expect(await client.readStatus()).toEqual({ kind: 'answered', status: A_STATUS });
    expect(fetch).toHaveBeenCalledWith(
      'http://requests:8421/api/status',
      expect.objectContaining({ headers: { Authorization: `Bearer ${A_SECRET}` } }),
    );
  });

  it('says when the secrets do not match', async () => {
    const client = createRequestsClient({
      address: 'http://requests:8421',
      secret: A_SECRET,
      fetch: answering(401, {}),
    });

    expect(await client.readStatus()).toEqual({
      kind: 'silent',
      reason: 'http://requests:8421 refused the secret; REQUESTS_SECRET must be the same on both',
    });
  });

  it('says what any other failure answered', async () => {
    const client = createRequestsClient({
      address: 'http://requests:8421',
      secret: A_SECRET,
      fetch: answering(502, {}),
    });

    expect(await client.readStatus()).toEqual({
      kind: 'silent',
      reason: 'http://requests:8421 answered 502',
    });
  });

  it('says when something else is answering at that address', async () => {
    const client = createRequestsClient({
      address: 'http://requests:8421',
      secret: A_SECRET,
      fetch: answering(200, { hello: 'world' }),
    });

    expect(await client.readStatus()).toEqual({
      kind: 'silent',
      reason: 'http://requests:8421 answered, but not as the requests service',
    });
  });

  it('says when nothing answers at all', async () => {
    const client = createRequestsClient({
      address: 'http://requests:8421',
      secret: A_SECRET,
      fetch: () => Promise.reject(new Error('connect ECONNREFUSED')),
    });

    expect(await client.readStatus()).toEqual({
      kind: 'silent',
      reason: 'http://requests:8421 did not answer',
    });
  });
});
