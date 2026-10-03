import { afterEach, describe, expect, it, vi } from 'vitest';
import { aServerAnswering } from '@ValenceClient/testing/aServerAnswering';
import { aLinkedServer } from '@ValenceClient/testing/aLinkedServer';
import { answerLinkedServer } from './answerLinkedServer';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('answerLinkedServer', () => {
  it('approves a server by its id', async () => {
    const server = aLinkedServer({ state: 'linked' });
    const asked = aServerAnswering(server);

    expect((await answerLinkedServer(server.id, 'approve')).value?.state).toBe('linked');
    expect(asked.mock.calls[0]?.[0]).toBe(`/api/linked-servers/${server.id}/approve`);
    expect(asked.mock.calls[0]?.[1]).toMatchObject({ method: 'POST' });
  });
});
