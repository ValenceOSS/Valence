import { describe, expect, it } from 'vitest';
import { readFixture } from './readFixture';

describe('readFixture', () => {
  it('reads a recorded answer', () => {
    expect(JSON.parse(readFixture('plex-identity.json'))).toMatchObject({
      MediaContainer: { machineIdentifier: 'abc123machine' },
    });
  });
});
