import { describe, expect, it } from 'vitest';
import { isCloudflareChallenge } from './isCloudflareChallenge';

describe('isCloudflareChallenge', () => {
  it('knows the browser check when it sees it', () => {
    expect(isCloudflareChallenge(403, 'cloudflare', '<title>Just a moment...</title>')).toBe(true);
    expect(isCloudflareChallenge(503, 'Cloudflare', '<script>window._cf_chl_opt={}</script>')).toBe(
      true,
    );
  });

  it('does not mistake an ordinary refusal, or an ordinary page, for it', () => {
    expect(isCloudflareChallenge(403, 'nginx', '<title>Just a moment...</title>')).toBe(false);
    expect(isCloudflareChallenge(200, 'cloudflare', '<title>Just a moment...</title>')).toBe(false);
    expect(isCloudflareChallenge(403, 'cloudflare', 'Forbidden')).toBe(false);
    expect(isCloudflareChallenge(403, null, 'challenge-platform')).toBe(false);
  });
});
