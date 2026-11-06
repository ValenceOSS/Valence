import { describe, expect, it, vi } from 'vitest';
import { unmatchTitle } from './unmatchTitle';

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock('@ValenceClient/admin/sendTitleWork', () => ({ sendTitleWork: send }));

describe('unmatchTitle', () => {
  it('asks for a title to be unmatched', async () => {
    send.mockResolvedValue({ kind: 'reached', count: 2, jobId: 'job' });

    await expect(unmatchTitle('a')).resolves.toEqual({ kind: 'reached', count: 2, jobId: 'job' });
    expect(send).toHaveBeenCalledWith('/api/media/a/unmatch');
  });
});
