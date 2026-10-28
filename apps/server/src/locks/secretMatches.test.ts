import { describe, expect, it } from 'vitest';
import { hashSecret } from './hashSecret';
import { secretMatches } from './secretMatches';

describe('secretMatches', () => {
  it('knows the secret a hash was made from, and no other', async () => {
    const kept = await hashSecret('2468');

    expect(await secretMatches('2468', kept)).toBe(true);
    expect(await secretMatches('2469', kept)).toBe(false);
  });

  it('refuses a hash it cannot read', async () => {
    expect(await secretMatches('2468', 'plain')).toBe(false);
  });

  it('keeps the server answering while it checks', async () => {
    const kept = await hashSecret('2468');
    let beats = 0;
    const beat = setInterval(() => {
      beats += 1;
    }, 1);

    await Promise.all(Array.from({ length: 8 }, () => secretMatches('2468', kept)));
    clearInterval(beat);

    expect(beats).toBeGreaterThan(0);
  });
});
