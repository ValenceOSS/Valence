import { describe, expect, it } from 'vitest';
import { aFakeClient } from './aFakeClient';

describe('aFakeClient', () => {
  it('answers by method and path, and remembers what it was asked', async () => {
    const { fetch, asked } = aFakeClient({ 'GET /version': () => new Response('v5.0.1') });
    const response = await fetch('http://client/version?x=1', {
      method: 'GET',
      headers: {},
      signal: AbortSignal.timeout(1000),
    });

    expect(await response.text()).toBe('v5.0.1');
    expect(asked[0]?.url.searchParams.get('x')).toBe('1');
  });

  it('knows nothing it was not told', async () => {
    const { fetch } = aFakeClient({});
    const response = await fetch('http://client/elsewhere', {
      method: 'POST',
      headers: {},
      body: 'x',
      signal: AbortSignal.timeout(1000),
    });

    expect(response.status).toBe(404);
  });
});
