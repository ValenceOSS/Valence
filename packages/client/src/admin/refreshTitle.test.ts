import { describe, expect, it, vi } from 'vitest';
import { refreshTitle } from './refreshTitle';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('@ValenceClient/admin/sendTitleWork', () => ({ sendTitleWork: send }));

describe('refreshTitle', () => {
  it('asks for a title again, with the fields only where only some are wanted', async () => {
    send.mockResolvedValue({ kind: 'reached', count: 1, jobId: null });

    await refreshTitle('a', 'details', ['rating']);
    await refreshTitle('a', 'fields', ['rating']);

    expect(send).toHaveBeenNthCalledWith(1, '/api/media/a/refresh', { mode: 'details' });
    expect(send).toHaveBeenNthCalledWith(2, '/api/media/a/refresh', {
      mode: 'fields',
      fields: ['rating'],
    });
  });
});
