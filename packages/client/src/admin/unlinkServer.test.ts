import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { unlinkServer } from './unlinkServer';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('unlinkServer', () => {
  it('unlinks a server by its id', async () => {
    const asked = aServerAnswering(null, 204);

    expect(await unlinkServer('a-server')).toBeNull();
    expect(asked.mock.calls[0]?.[0]).toBe('/api/linked-servers/a-server');
    expect(asked.mock.calls[0]?.[1]).toMatchObject({ method: 'DELETE' });
  });
});
