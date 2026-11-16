import { describe, expect, it } from 'vitest';
import { theAppsPage } from './theAppsPage';

const ORIGIN = 'http://127.0.0.1:';

describe('theAppsPage', () => {
  it("finds the app's window among everything the webview lists", () => {
    expect(
      theAppsPage(
        [
          {
            type: 'service_worker',
            url: 'http://127.0.0.1:41847/sw.js',
            webSocketDebuggerUrl: 'ws://a',
          },
          {
            type: 'page',
            url: 'https://www.youtube-nocookie.com/embed/x',
            webSocketDebuggerUrl: 'ws://b',
          },
          { type: 'page', url: 'http://127.0.0.1:41847/library', webSocketDebuggerUrl: 'ws://c' },
        ],
        ORIGIN,
      ),
    ).toBe('ws://c');
  });

  it('passes over the update window', () => {
    expect(
      theAppsPage(
        [
          {
            type: 'page',
            url: 'http://127.0.0.1:41847/update.html?step=ready',
            webSocketDebuggerUrl: 'ws://u',
          },
          { type: 'page', url: 'http://127.0.0.1:41847/', webSocketDebuggerUrl: 'ws://m' },
        ],
        ORIGIN,
      ),
    ).toBe('ws://m');
  });

  it('finds nothing where the page cannot be driven or is not open yet', () => {
    expect(theAppsPage([{ type: 'page', url: 'http://127.0.0.1:41847/' }], ORIGIN)).toBeNull();
    expect(theAppsPage([], ORIGIN)).toBeNull();
    expect(
      theAppsPage(
        [{ type: 'page', url: 'http://127.0.0.1:41847/', webSocketDebuggerUrl: 'ws://m' }],
        'http://127.0.0.1:41848/',
      ),
    ).toBeNull();
  });
});
