import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { syncLinkedServer } from './syncLinkedServer';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('syncLinkedServer', () => {
  it('reads a linked server again now, and says how much it read', async () => {
    const asked = aServerAnswering({ libraries: 2, kept: 40, forgotten: 1 });

    expect(await syncLinkedServer('a-server')).toEqual({
      value: { libraries: 2, kept: 40, forgotten: 1 },
      refusal: null,
    });
    expect(asked.mock.calls[0]?.[0]).toBe('/api/linked-servers/a-server/sync');
    expect(asked.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
  });
});
