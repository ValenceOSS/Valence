import { EventEmitter } from 'node:events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { followTheUpdates } from './followTheUpdates';
import type { FollowedUpdates } from './followTheUpdates';
import type { UpdateCheckResult } from 'electron-updater';
import type { DesktopUpdate } from '@ValenceContracts/schemas/DesktopUpdate';

const aUpdater = ({
  checkForUpdates = () => Promise.resolve(null),
  downloadUpdate = () => Promise.resolve([]),
}: {
  checkForUpdates?: () => Promise<UpdateCheckResult | null>;
  downloadUpdate?: () => Promise<string[]>;
} = {}) =>
  Object.assign(new EventEmitter(), {
    checkForUpdates: vi.fn(checkForUpdates),
    downloadUpdate: vi.fn(downloadUpdate),
    quitAndInstall: vi.fn(),
  });

describe('followTheUpdates', () => {
  let followed: FollowedUpdates | null = null;

  afterEach(() => {
    followed?.stop();
    followed = null;
    vi.useRealTimers();
  });

  it('knows of nothing until a release is found', () => {
    followed = followTheUpdates({ updater: aUpdater(), onChange: vi.fn(), log: vi.fn() });

    expect(followed.now()).toEqual({ kind: 'none' });
  });

  it('offers a release it finds, and fetches nothing of its own accord', () => {
    const updater = aUpdater();
    const onChange = vi.fn();

    followed = followTheUpdates({ updater, onChange, log: vi.fn() });
    updater.emit('update-available', { version: '1.2.0' });

    expect(onChange).toHaveBeenCalledWith({ kind: 'available', version: '1.2.0' });
    expect(followed.now()).toEqual({ kind: 'available', version: '1.2.0' });
    expect(updater.downloadUpdate).not.toHaveBeenCalled();
  });

  it('says nothing new when the next check finds the same release', () => {
    const updater = aUpdater();
    const onChange = vi.fn();

    followed = followTheUpdates({ updater, onChange, log: vi.fn() });
    updater.emit('update-available', { version: '1.2.0' });
    updater.emit('update-available', { version: '1.2.0' });

    expect(onChange).toHaveBeenCalledOnce();
  });

  it('fetches the release once asked to, and shows how far it has got', () => {
    const updater = aUpdater({ downloadUpdate: () => new Promise(() => undefined) });
    const onChange = vi.fn<(update: DesktopUpdate) => void>();

    followed = followTheUpdates({ updater, onChange, log: vi.fn() });
    updater.emit('update-available', { version: '1.2.0' });
    followed.download();
    updater.emit('download-progress', { percent: 45.7 });
    updater.emit('download-progress', { percent: 45.9 });

    expect(updater.downloadUpdate).toHaveBeenCalledOnce();
    expect(onChange.mock.calls.map(([update]) => update)).toEqual([
      { kind: 'available', version: '1.2.0' },
      { kind: 'downloading', version: '1.2.0', percent: 0 },
      { kind: 'downloading', version: '1.2.0', percent: 45 },
    ]);
  });

  it('restarts into the release the moment it is on disk, since the answer was already yes', () => {
    const updater = aUpdater({ downloadUpdate: () => new Promise(() => undefined) });

    followed = followTheUpdates({ updater, onChange: vi.fn(), log: vi.fn() });
    updater.emit('update-available', { version: '1.2.0' });
    followed.download();
    updater.emit('update-downloaded', { version: '1.2.0' });

    expect(updater.quitAndInstall).toHaveBeenCalledWith(true, true);
  });

  it('fetches nothing where there is nothing to fetch', () => {
    const updater = aUpdater();

    followed = followTheUpdates({ updater, onChange: vi.fn(), log: vi.fn() });
    followed.download();

    expect(updater.downloadUpdate).not.toHaveBeenCalled();
  });

  it('says a download failed, and fetches it again when asked', async () => {
    const updater = aUpdater({ downloadUpdate: () => Promise.reject(new Error('offline')) });
    const onChange = vi.fn();

    followed = followTheUpdates({ updater, onChange, log: vi.fn() });
    updater.emit('update-available', { version: '1.2.0' });
    followed.download();

    await vi.waitFor(
      () => {
        expect(followed?.now()).toEqual({ kind: 'failed', version: '1.2.0' });
      },
      { timeout: 5_000 },
    );

    followed.download();

    expect(updater.downloadUpdate).toHaveBeenCalledTimes(2);
  });

  it('keeps a download going when a check finds the same release mid-way', () => {
    const updater = aUpdater({ downloadUpdate: () => new Promise(() => undefined) });

    followed = followTheUpdates({ updater, onChange: vi.fn(), log: vi.fn() });
    updater.emit('update-available', { version: '1.2.0' });
    followed.download();
    updater.emit('update-available', { version: '1.2.0' });

    expect(followed.now()).toEqual({ kind: 'downloading', version: '1.2.0', percent: 0 });
  });

  it('writes down what went wrong, and what it was asked to do', () => {
    const updater = aUpdater({ downloadUpdate: () => new Promise(() => undefined) });
    const log = vi.fn();

    followed = followTheUpdates({ updater, onChange: vi.fn(), log });
    updater.emit('update-available', { version: '1.2.0' });
    followed.download();
    updater.emit('error', new Error('net::ERR_CONNECTION_RESET'));

    expect(log).toHaveBeenCalledWith('Asked to download 1.2.0');
    expect(log).toHaveBeenCalledWith('Failed: net::ERR_CONNECTION_RESET');
  });

  it('asks once as soon as it starts', () => {
    const updater = aUpdater();

    followed = followTheUpdates({ updater, onChange: vi.fn(), log: vi.fn() });

    expect(updater.checkForUpdates).toHaveBeenCalledOnce();
  });

  it('carries on checking after a check fails', async () => {
    vi.useFakeTimers();

    const updater = aUpdater({ checkForUpdates: () => Promise.reject(new Error('offline')) });

    followed = followTheUpdates({ updater, every: 1000, onChange: vi.fn(), log: vi.fn() });

    await vi.advanceTimersByTimeAsync(1000);

    expect(updater.checkForUpdates).toHaveBeenCalledTimes(2);
  });

  it('does not check while a download is running', async () => {
    vi.useFakeTimers();

    const updater = aUpdater({ downloadUpdate: () => new Promise(() => undefined) });

    followed = followTheUpdates({ updater, every: 1000, onChange: vi.fn(), log: vi.fn() });
    updater.emit('update-available', { version: '1.2.0' });
    followed.download();

    await vi.advanceTimersByTimeAsync(1000);

    expect(updater.checkForUpdates).toHaveBeenCalledOnce();
  });

  it('stops checking once stopped', async () => {
    vi.useFakeTimers();

    const updater = aUpdater();

    followed = followTheUpdates({ updater, every: 1000, onChange: vi.fn(), log: vi.fn() });
    await vi.advanceTimersByTimeAsync(0);
    followed.stop();
    await vi.advanceTimersByTimeAsync(5000);

    expect(updater.checkForUpdates).toHaveBeenCalledOnce();
  });
});
