import { describe, expect, it } from 'vitest';
import { aFakeJellyfin } from './aFakeJellyfin';

describe('aFakeJellyfin', () => {
  it('answers as Jellyfin, refuses without the token, and records what it was asked', async () => {
    const jellyfin = aFakeJellyfin();

    expect((await jellyfin.send(`${jellyfin.address}/System/Info/Public`)).status).toBe(200);
    expect((await jellyfin.send(`${jellyfin.address}/Users/Me`)).status).toBe(401);
    expect(jellyfin.asked).toHaveLength(2);
  });
});
