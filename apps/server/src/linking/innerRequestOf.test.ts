import { describe, expect, it } from 'vitest';
import { innerRequestOf } from './innerRequestOf';

describe('innerRequestOf', () => {
  it('says how long a body is, so it is never rebuilt to be measured', async () => {
    const body = new TextEncoder().encode('{"id":"x"}').buffer;
    const inner = innerRequestOf('http://valence/api/a', 'POST', new Headers(), body);

    expect(inner.headers.get('content-length')).toBe('10');
    expect(await inner.text()).toBe('{"id":"x"}');
  });

  it('adds nothing where nothing was sent', () => {
    const inner = innerRequestOf('http://valence/api/a', 'GET', new Headers(), null);

    expect(inner.headers.has('content-length')).toBe(false);
  });
});
