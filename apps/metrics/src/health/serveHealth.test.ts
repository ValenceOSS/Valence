import { describe, expect, it, vi } from 'vitest';
import { openDatabase } from '@ValenceMetrics/db/openDatabase';
import { serveHealth } from './serveHealth';

vi.mock('@ValenceMetrics/db/openDatabase', () => ({
  openDatabase: vi.fn(() => ({ execute: vi.fn(() => Promise.resolve([])) })),
}));

describe('serveHealth', () => {
  it('says it is up while the database answers', async () => {
    const response = await serveHealth();

    expect(response.status).toBe(200);
    expect(await response.json()).toStrictEqual({ status: 'ok' });
  });

  it('says it is unavailable when there is no database to reach', async () => {
    vi.mocked(openDatabase).mockImplementationOnce(() => {
      throw new Error('DATABASE_URL is not set');
    });

    const response = await serveHealth();

    expect(response.status).toBe(503);
    expect(await response.json()).toStrictEqual({ status: 'unavailable' });
  });
});
