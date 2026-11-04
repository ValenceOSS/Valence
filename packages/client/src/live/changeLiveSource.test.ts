import { describe, expect, it, vi } from 'vitest';
import { changeLiveSource } from '@ValenceClient/live/changeLiveSource';
import { LiveSourceSchema } from '@ValenceContracts/schemas/LiveTv';

const sendToLiveTv = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/live/sendToLiveTv', () => ({ sendToLiveTv }));

describe('changeLiveSource', () => {
  it('sends the change to the source it names', async () => {
    sendToLiveTv.mockResolvedValue({ value: null, refusal: null });

    await changeLiveSource('a source/1', { name: 'Kitchen aerial' });

    expect(sendToLiveTv).toHaveBeenCalledWith(
      '/sources/a%20source%2F1',
      'PATCH',
      LiveSourceSchema,
      {
        name: 'Kitchen aerial',
      },
    );
  });
});
