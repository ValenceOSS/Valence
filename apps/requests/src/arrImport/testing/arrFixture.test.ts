import { describe, expect, it } from 'vitest';
import { arrFixture } from './arrFixture';

describe('arrFixture', () => {
  it('reads each recorded answer by what it answers', () => {
    expect(arrFixture('prowlarr')['GET /api/v1/system/status']?.body).toMatchObject({
      appName: 'Prowlarr',
    });
  });
});
