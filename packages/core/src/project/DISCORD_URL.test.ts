import { describe, expect, it } from 'vitest';
import { DISCORD_URL } from './DISCORD_URL';

describe('DISCORD_URL', () => {
  it('invites people to the project’s Discord', () => {
    expect(DISCORD_URL).toBe('https://discord.gg/uTtcAHMy9N');
  });
});
