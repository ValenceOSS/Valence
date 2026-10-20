import { describe, expect, it, vi } from 'vitest';
import { aShownRequest } from '@ValenceServer/testing/aShownRequest';
import { createWebhookRequestReader } from './createWebhookRequestReader';

const DISCORD_IDS: Record<string, string> = {
  'account-1': '100000000000000001',
  'account-2': '100000000000000002',
};

const request = aShownRequest({
  requestedBy: { id: 'account-1', name: 'Sam' },
  alsoAskedBy: [
    { id: 'account-2', name: 'Jess' },
    { id: 'account-3', name: 'Alex' },
  ],
});

describe('createWebhookRequestReader', () => {
  it('carries the Discord ID of everybody who asked, looking each account up once', async () => {
    const discordIdOf = vi.fn((userId: string) => Promise.resolve(DISCORD_IDS[userId] ?? null));
    const described = await createWebhookRequestReader(discordIdOf)({
      ...request,
      alsoAskedBy: [...request.alsoAskedBy, { id: 'account-1', name: 'Sam' }],
    });

    expect(described.requestedByDiscordId).toBe('100000000000000001');
    expect(described.askers.map((asker) => asker.discordId)).toEqual([
      '100000000000000001',
      '100000000000000002',
      null,
      '100000000000000001',
    ]);
    expect(discordIdOf).toHaveBeenCalledTimes(3);
  });

  it('carries none where an account cannot be read, or there is no way to read them', async () => {
    const failing = await createWebhookRequestReader(() =>
      Promise.reject(new Error('database is down')),
    )(request);
    const without = await createWebhookRequestReader()(request);

    for (const described of [failing, without]) {
      expect(described.requestedByDiscordId).toBeNull();
      expect(described.askers.every((asker) => asker.discordId === null)).toBe(true);
    }
  });
});
