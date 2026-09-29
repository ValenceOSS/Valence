import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { aSecretAndItsChallenge } from './aSecretAndItsChallenge';

describe('aSecretAndItsChallenge', () => {
  it('makes a challenge the server will match against the secret', async () => {
    const { secret, challenge } = await aSecretAndItsChallenge();

    expect(challenge).toBe(createHash('sha256').update(secret, 'utf8').digest('hex'));
  });

  it('makes a secret long enough for the server to take', async () => {
    const { secret } = await aSecretAndItsChallenge();

    expect(secret).toMatch(/^[0-9a-f]{64}$/);
  });

  it('makes a different one every time', async () => {
    const [first, second] = await Promise.all([aSecretAndItsChallenge(), aSecretAndItsChallenge()]);

    expect(first.secret).not.toBe(second.secret);
  });
});
