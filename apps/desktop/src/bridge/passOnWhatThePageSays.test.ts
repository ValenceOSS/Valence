import { afterEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { passOnWhatThePageSays } from './passOnWhatThePageSays';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn(() => Promise.resolve(null)) }));

afterEach(() => {
  vi.mocked(invoke).mockClear();
});

describe('passOnWhatThePageSays', () => {
  it('asks the host to point the window at a different server', () => {
    const within = document.implementation.createHTMLDocument();

    passOnWhatThePageSays(within);
    within.dispatchEvent(new CustomEvent('valence:change-server'));

    expect(invoke).toHaveBeenCalledWith('change_server', undefined);
  });

  it('hides the window’s own controls while a film plays with its controls hidden', async () => {
    const within = document.implementation.createHTMLDocument();

    passOnWhatThePageSays(within);
    within.documentElement.dataset['valenceWatching'] = 'hidden';

    await vi.waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('show_the_window_controls', { isShown: false });
    });

    within.documentElement.dataset['valenceWatching'] = 'shown';

    await vi.waitFor(() => {
      expect(invoke).toHaveBeenLastCalledWith('show_the_window_controls', { isShown: true });
    });
  });

  it('keeps the screen on, and lets it go, as the page asks', () => {
    const within = document.implementation.createHTMLDocument();

    passOnWhatThePageSays(within);
    within.dispatchEvent(new CustomEvent('valence:keep-the-screen-on', { detail: true }));
    within.dispatchEvent(new CustomEvent('valence:keep-the-screen-on', { detail: false }));

    expect(invoke).toHaveBeenNthCalledWith(1, 'keep_the_screen_on', { isOn: true });
    expect(invoke).toHaveBeenNthCalledWith(2, 'keep_the_screen_on', { isOn: false });
  });

  it('lets the screen go where the page says something that is not an event of its own', () => {
    const within = document.implementation.createHTMLDocument();

    passOnWhatThePageSays(within);
    within.dispatchEvent(new Event('valence:keep-the-screen-on'));

    expect(invoke).toHaveBeenCalledWith('keep_the_screen_on', { isOn: false });
  });

  it('says what is playing, for the host to tell Discord', () => {
    const within = document.implementation.createHTMLDocument();
    const doing = { kind: 'browsing', look: 'valence' };

    passOnWhatThePageSays(within);
    within.dispatchEvent(new CustomEvent('valence:now-watching', { detail: doing }));

    expect(invoke).toHaveBeenCalledWith('now_watching', { said: doing });
  });

  it('takes the status down where what is playing is nothing, or nothing it can pass on', () => {
    const within = document.implementation.createHTMLDocument();

    passOnWhatThePageSays(within);
    within.dispatchEvent(new CustomEvent('valence:now-watching', { detail: null }));
    within.dispatchEvent(new CustomEvent('valence:now-watching', { detail: () => 'playing' }));
    within.dispatchEvent(new Event('valence:now-watching'));

    expect(invoke).toHaveBeenCalledTimes(3);
    expect(invoke).toHaveBeenCalledWith('now_watching', { said: null });
    expect(
      vi.mocked(invoke).mock.calls.every(([, args]) => JSON.stringify(args) === '{"said":null}'),
    ).toBe(true);
  });
});
