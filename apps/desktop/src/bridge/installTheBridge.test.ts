import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { fakeTheHostsEvents } from '@ValenceDesktop/testing/fakeTheHostsEvents';
import { catchUpWithTheHost } from '@ValenceDesktop/bridge/catchUpWithTheHost';
import { installTheBridge } from './installTheBridge';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn() }));

vi.mock('@ValenceDesktop/bridge/catchUpWithTheHost', () => ({
  catchUpWithTheHost: vi.fn(() => Promise.resolve()),
}));

const ABOUT = {
  version: '1.1.0',
  isADevBuild: true,
  computerName: 'Studio Mac',
  commit: '2ae1bc1',
  arch: 'x64',
  platform: 'linux',
  webview: 'WebKitGTK 2.48.3',
  tauri: '2.12.6',
};

const BOOTED = {
  preferences: { 'valence.server.address': 'https://valence.example.com' },
  thisLaunch: { 'valence.profile': 'p1' },
  alreadyFound: ['http://localhost:8420'],
  alreadyNearby: [{ address: 'http://192.168.1.4:8420', name: 'Living room' }],
  update: { kind: 'available', version: '1.2.0' },
  frame: { isMaximised: true, isFullScreen: false },
  isReachable: false,
  about: ABOUT,
  passkeyWay: 'page',
};

const OPTIONS = { challenge: 'c2lnbg', rpId: 'valence.example.com', allowCredentials: [] };

let host = fakeTheHostsEvents();

/**
 * Waits until the bridge is listening for an event, so what the host says next is heard.
 *
 * @param event - The event's name.
 */
const listeningFor = async (event: string): Promise<void> => {
  await vi.waitFor(() => {
    expect(host.listening(event)).toBeGreaterThan(0);
  });
};

beforeEach(() => {
  host = fakeTheHostsEvents();
  vi.mocked(invoke).mockResolvedValue(null);
  window.__VALENCE_BOOT__ = BOOTED;
  document.documentElement.dataset['valenceDesktop'] = 'true';
  document.documentElement.dataset['valencePlatform'] = 'linux';
});

afterEach(() => {
  vi.mocked(invoke).mockReset();
  vi.mocked(listen).mockReset();
  delete window.__VALENCE_BOOT__;
  delete document.documentElement.dataset['valenceDesktop'];
  delete document.documentElement.dataset['valencePlatform'];
});

describe('installTheBridge', () => {
  it('asks the host how things stand once it is listening', () => {
    installTheBridge();

    const keep = vi.mocked(catchUpWithTheHost).mock.calls[0]?.[0];

    expect(typeof keep?.reach).toBe('function');
    expect(typeof keep?.update).toBe('function');
    expect(typeof keep?.frame).toBe('function');
  });

  it('reads what the page was booted with', () => {
    installTheBridge();

    expect(window.valence.preferences.held).toEqual(BOOTED.preferences);
    expect(window.valence.thisLaunch.held).toEqual(BOOTED.thisLaunch);
    expect(window.valence.servers?.alreadyFound).toEqual(BOOTED.alreadyFound);
    expect(window.valence.servers?.alreadyNearby).toEqual(BOOTED.alreadyNearby);
    expect(window.valence.update.now()).toEqual(BOOTED.update);
    expect(window.valence.frame.now()).toEqual(BOOTED.frame);
    expect(window.valence.reach.now()).toBe(false);
    expect(window.valence.passkeys.way).toBe('page');
  });

  it('says what the build is and runs on, leaving the platform to the document', () => {
    installTheBridge();

    expect(window.valence.about).toEqual({
      version: '1.1.0',
      isADevBuild: true,
      computerName: 'Studio Mac',
      commit: '2ae1bc1',
      arch: 'x64',
      webview: 'WebKitGTK 2.48.3',
      tauri: '2.12.6',
    });
  });

  it('leaves the mark the host put on the document as it is', () => {
    document.documentElement.dataset['valencePlatform'] = 'darwin';

    installTheBridge();

    expect(document.documentElement.dataset['valencePlatform']).toBe('darwin');
  });

  it('marks the document itself where the host did not', () => {
    delete document.documentElement.dataset['valenceDesktop'];
    delete document.documentElement.dataset['valencePlatform'];

    installTheBridge();

    expect(document.documentElement.dataset['valenceDesktop']).toBe('true');
    expect(document.documentElement.dataset['valencePlatform']).toBe('linux');
  });

  it.each([
    [
      'preferences_write',
      () => window.valence.preferences.write('k', 'v'),
      { key: 'k', value: 'v' },
    ],
    ['preferences_forget', () => window.valence.preferences.forget('k'), { key: 'k' }],
    [
      'this_launch_write',
      () => window.valence.thisLaunch.write('k', 'v'),
      { key: 'k', value: 'v' },
    ],
    ['this_launch_forget', () => window.valence.thisLaunch.forget('k'), { key: 'k' }],
    ['go_to_the_server', () => window.valence.goToTheServer(), undefined],
    ['update_download', () => window.valence.update.download(), undefined],
    ['frame_minimise', () => window.valence.frame.minimise(), undefined],
    ['frame_maximise', () => window.valence.frame.maximise(), undefined],
    ['frame_close', () => window.valence.frame.close(), undefined],
    [
      'set_unread_badge',
      () => window.valence.notifications.setBadge(2),
      { count: 2, picture: null },
    ],
    [
      'passkeys_add_one_in_the_browser',
      () => window.valence.passkeys.addOneInTheBrowser(),
      undefined,
    ],
  ])('tells the host %s', (command, told, args) => {
    installTheBridge();

    told();

    expect(invoke).toHaveBeenCalledWith(command, args);
  });

  it.each([
    [
      'held_keep',
      () => window.valence.held.keep({ downloadId: 'd' }),
      { what: { downloadId: 'd' } },
    ],
    ['held_drop', () => window.valence.held.drop('d'), { downloadId: 'd' }],
    ['held_pause', () => window.valence.held.pause('d', true), { downloadId: 'd', isPaused: true }],
    ['listening_stop', () => window.valence.listening.stop('a.flac'), { name: 'a.flac' }],
    ['listening_drop', () => window.valence.listening.drop('a.flac'), { name: 'a.flac' }],
  ])('asks the host %s and waits for it', async (command, asked, args) => {
    installTheBridge();

    await asked();

    expect(invoke).toHaveBeenCalledWith(command, args);
  });

  it('hands back what the host holds, and what it fetched to listen to', async () => {
    vi.mocked(invoke).mockResolvedValueOnce([{ downloadId: 'd' }]);
    vi.mocked(invoke).mockResolvedValueOnce({ bytes: 6, isComplete: true, failure: null });
    installTheBridge();

    await expect(window.valence.held.all()).resolves.toEqual([{ downloadId: 'd' }]);
    await expect(window.valence.listening.fetch('/api/a', 'a.flac')).resolves.toEqual({
      bytes: 6,
      isComplete: true,
      failure: null,
    });
    expect(invoke).toHaveBeenCalledWith('held_all');
    expect(invoke).toHaveBeenCalledWith('listening_fetch', { from: '/api/a', name: 'a.flac' });
  });

  it('says whether a song is already kept, and that it is not where the answer makes no sense', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(true);
    vi.mocked(invoke).mockResolvedValueOnce('yes');
    installTheBridge();

    await expect(window.valence.listening.has('a.flac')).resolves.toBe(true);
    await expect(window.valence.listening.has('a.flac')).resolves.toBe(false);
    expect(invoke).toHaveBeenCalledWith('listening_has', { name: 'a.flac' });
  });

  it('asks the host whether an address is a Valence, and takes no answer as no', async () => {
    vi.mocked(invoke).mockResolvedValueOnce(true);
    vi.mocked(invoke).mockRejectedValueOnce(new Error('unreachable'));
    installTheBridge();

    await expect(window.valence.servers?.reach('http://nas:8420')).resolves.toBe(true);
    await expect(window.valence.servers?.reach('http://nas:8420')).resolves.toBe(false);
    expect(invoke).toHaveBeenCalledWith('servers_reach', { address: 'http://nas:8420' });
  });

  it('asks the host for passkeys with what the server asked', async () => {
    vi.mocked(invoke).mockResolvedValue({ kind: 'cancelled' });
    installTheBridge();

    await expect(window.valence.passkeys.ask(OPTIONS)).resolves.toEqual({ kind: 'cancelled' });
    await expect(
      window.valence.passkeys.make({
        challenge: 'c2lnbg',
        rp: { id: 'valence.example.com', name: 'Valence' },
        user: { id: 'dQ', name: 'ada', displayName: 'Ada' },
        pubKeyCredParams: [{ type: 'public-key', alg: -7 }],
      }),
    ).resolves.toEqual({ kind: 'cancelled' });
    await expect(window.valence.passkeys.signInOnAPage('c', null)).resolves.toEqual({
      kind: 'cancelled',
    });
    expect(invoke).toHaveBeenCalledWith('passkeys_ask', { options: OPTIONS });
    expect(invoke).toHaveBeenCalledWith('passkeys_make', expect.objectContaining({}));
    expect(invoke).toHaveBeenCalledWith('passkeys_sign_in_on_a_page', {
      challenge: 'c',
      profileId: null,
    });
  });

  it('keeps the reach, the update and the frame up with what the host announces', async () => {
    installTheBridge();
    await listeningFor('valence:reach-changed');
    await listeningFor('valence:update-changed');
    await listeningFor('valence:frame-changed');

    host.emit('valence:reach-changed', true);
    host.emit('valence:update-changed', { kind: 'downloading', version: '1.2.0', percent: 40 });
    host.emit('valence:frame-changed', { isMaximised: false, isFullScreen: true });

    expect(window.valence.reach.now()).toBe(true);
    expect(window.valence.update.now()).toEqual({
      kind: 'downloading',
      version: '1.2.0',
      percent: 40,
    });
    expect(window.valence.frame.now()).toEqual({ isMaximised: false, isFullScreen: true });
  });

  it('passes on what the host hears about downloads, songs and servers nearby', async () => {
    installTheBridge();

    const held = vi.fn();
    const progress = vi.fn();
    const found = vi.fn();
    const nearby = vi.fn();

    window.valence.held.whenChanged(held);
    window.valence.listening.whenProgress(progress);
    window.valence.servers?.whenFound(found);
    window.valence.servers?.whenNearbyChanges(nearby);
    await listeningFor('valence:held-changed');
    await listeningFor('valence:listening-progress');
    await listeningFor('valence:found');
    await listeningFor('valence:nearby-changed');

    host.emit('valence:held-changed', []);
    host.emit('valence:listening-progress', { name: 'a.flac', bytes: 3, ofBytes: null });
    host.emit('valence:found', 'http://localhost:8420');
    host.emit('valence:nearby-changed', 'nobody');

    expect(held).toHaveBeenCalledWith([]);
    expect(progress).toHaveBeenCalledWith({ name: 'a.flac', bytes: 3, ofBytes: null });
    expect(found).toHaveBeenCalledWith('http://localhost:8420');
    expect(nearby).toHaveBeenCalledWith([]);
  });
});
