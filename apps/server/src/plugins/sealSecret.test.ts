import { describe, expect, it } from 'vitest';
import { openSecret } from './openSecret';
import { sealSecret } from './sealSecret';
import { sealingKeyFrom } from './sealingKeyFrom';

const key = sealingKeyFrom('a-server-secret-that-is-long-enough-to-use');

describe('sealing plugin secrets', () => {
  it('opens what it sealed', () => {
    expect(openSecret(key, sealSecret(key, 'token-123'))).toBe('token-123');
  });

  it('seals the same secret differently each time', () => {
    expect(sealSecret(key, 'same')).not.toBe(sealSecret(key, 'same'));
  });

  it('opens nothing under another key', () => {
    const other = sealingKeyFrom('another-server-secret-entirely-different');

    expect(openSecret(other, sealSecret(key, 'token'))).toBeNull();
  });

  it('opens nothing that was tampered with', () => {
    const sealed = sealSecret(key, 'token').split('.');
    const body = Buffer.from(sealed[3] ?? '', 'base64');

    body[0] = (body[0] ?? 0) ^ 1;

    expect(openSecret(key, [...sealed.slice(0, 3), body.toString('base64')].join('.'))).toBeNull();
  });

  it('opens nothing that was never sealed', () => {
    expect(openSecret(key, 'plain-text')).toBeNull();
    expect(openSecret(key, 'v1.a.b')).toBeNull();
  });

  it('derives the same key from the same secret', () => {
    expect(sealingKeyFrom('x'.repeat(40)).equals(sealingKeyFrom('x'.repeat(40)))).toBe(true);
  });

  it('derives another key for another purpose, keeping plugin secrets the default', () => {
    const secret = 'x'.repeat(40);

    expect(sealingKeyFrom(secret, 'valence-plugin-secrets').equals(sealingKeyFrom(secret))).toBe(
      true,
    );
    expect(sealingKeyFrom(secret, 'valence-calendar-feeds').equals(sealingKeyFrom(secret))).toBe(
      false,
    );
  });
});
