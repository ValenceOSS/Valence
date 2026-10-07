import { describe, expect, it } from 'vitest';
import { webhookIconOf } from './webhookIconOf';

describe('webhookIconOf', () => {
  it('gives the icon at a server’s public address', () => {
    expect(webhookIconOf('https://valence.example.com')).toBe(
      'https://valence.example.com/icon.png',
    );
    expect(webhookIconOf('https://example.com/valence/')).toBe('https://example.com/icon.png');
  });

  it('gives nothing for a server a receiver could not reach', () => {
    expect(webhookIconOf('http://localhost:8420')).toBeNull();
    expect(webhookIconOf('not an address')).toBeNull();
  });
});
