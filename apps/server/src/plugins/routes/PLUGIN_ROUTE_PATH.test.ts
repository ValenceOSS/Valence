import { describe, expect, it } from 'vitest';
import { PLUGIN_ROUTE_PATH } from './PLUGIN_ROUTE_PATH';

describe('PLUGIN_ROUTE_PATH', () => {
  it('matches a plugin route and anything under it', () => {
    expect(PLUGIN_ROUTE_PATH.test('/api/plugins/music/routes/rest')).toBe(true);
    expect(PLUGIN_ROUTE_PATH.test('/api/plugins/music/routes/rest/ping.view')).toBe(true);
  });

  it('matches nothing else of a plugin’s', () => {
    expect(PLUGIN_ROUTE_PATH.test('/api/plugins/music/app-passwords')).toBe(false);
    expect(PLUGIN_ROUTE_PATH.test('/api/plugins/music/routes')).toBe(false);
    expect(PLUGIN_ROUTE_PATH.test('/api/plugins/music/routesx/rest')).toBe(false);
    expect(PLUGIN_ROUTE_PATH.test('/api/plugins/Music/routes/rest')).toBe(false);
  });
});
