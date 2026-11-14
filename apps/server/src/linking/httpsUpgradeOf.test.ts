import { describe, expect, it } from 'vitest';
import { httpsUpgradeOf } from './httpsUpgradeOf';

describe('httpsUpgradeOf', () => {
  it('follows the same name to https, on the default port or the same one', () => {
    expect(httpsUpgradeOf('http://friend.example/a', 'https://friend.example/a')).toBe(
      'https://friend.example/a',
    );
    expect(httpsUpgradeOf('http://friend.example:8420/a', 'https://friend.example:8420/a')).toBe(
      'https://friend.example:8420/a',
    );
    expect(httpsUpgradeOf('http://friend.example:8420/a', 'https://friend.example/a')).toBe(
      'https://friend.example/a',
    );
    expect(httpsUpgradeOf('http://friend.example/a', '/b')).toBeNull();
  });

  it('follows nothing else', () => {
    expect(httpsUpgradeOf('http://friend.example/a', 'https://other.example/a')).toBeNull();
    expect(httpsUpgradeOf('http://friend.example/a', 'http://friend.example/b')).toBeNull();
    expect(httpsUpgradeOf('https://friend.example/a', 'https://friend.example/b')).toBeNull();
    expect(httpsUpgradeOf('http://friend.example/a', 'https://friend.example:9999/a')).toBeNull();
    expect(httpsUpgradeOf('http://friend.example/a', 'https://u:p@friend.example/a')).toBeNull();
    expect(httpsUpgradeOf('http://friend.example/a', null)).toBeNull();
  });
});
