import { describe, expect, it } from 'vitest';
import { joinClientPath } from './joinClientPath';

describe('joinClientPath', () => {
  it('joins a path on whether or not the address ends in a slash', () => {
    expect(joinClientPath('http://qbittorrent:8080/', '/api/v2/app/version')).toBe(
      'http://qbittorrent:8080/api/v2/app/version',
    );
    expect(joinClientPath('http://host/sabnzbd', '/api')).toBe('http://host/sabnzbd/api');
  });
});
