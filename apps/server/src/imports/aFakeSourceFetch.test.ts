import { describe, expect, it } from 'vitest';
import { aFakeSourceFetch } from './aFakeSourceFetch';

describe('aFakeSourceFetch', () => {
  it('answers as told, remembering how it was asked', async () => {
    const { fetch, calls } = aFakeSourceFetch((asked) =>
      asked.url.pathname === '/here' ? { body: '{"a":1}' } : null,
    );

    const found = await fetch('http://source/here?x=1', {
      method: 'GET',
      headers: { k: 'v' },
      signal: AbortSignal.timeout(1000),
    });
    const missing = await fetch('http://source/there', {
      method: 'GET',
      headers: {},
      signal: AbortSignal.timeout(1000),
    });

    expect(found.status).toBe(200);
    expect(await found.text()).toBe('{"a":1}');
    expect(missing.status).toBe(404);
    expect(
      calls.map((call) => [call.method, call.url.searchParams.get('x'), call.headers]),
    ).toEqual([
      ['GET', '1', { k: 'v' }],
      ['GET', null, {}],
    ]);
  });
});
