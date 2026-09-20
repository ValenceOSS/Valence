import { QueryClient } from '@tanstack/react-query';
import { describe, expect, it, vi } from 'vitest';
import { appearanceQueries } from './appearanceQueries';

const fetchAppearance = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/appearance/fetchAppearance', () => ({ fetchAppearance }));

describe('appearanceQueries', () => {
  it('asks how the server says it should look', async () => {
    fetchAppearance.mockResolvedValue({ roundness: 'soft' });

    await expect(new QueryClient().fetchQuery(appearanceQueries.appearance())).resolves.toEqual({
      roundness: 'soft',
    });
  });

  it('does not retry, since a server that cannot be reached has nothing to say', () => {
    expect(appearanceQueries.appearance().retry).toBe(false);
  });
});
