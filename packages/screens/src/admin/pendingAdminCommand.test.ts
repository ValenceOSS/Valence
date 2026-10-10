import { describe, expect, it, vi } from 'vitest';
import {
  listenForAdminCommands,
  requestAdminCommand,
  takeAdminCommand,
} from './pendingAdminCommand';

describe('pendingAdminCommand', () => {
  it('holds an action asked for until the page that carries it out takes it, once', () => {
    requestAdminCommand('addDownloadClient');

    expect(takeAdminCommand('createWebhook')).toBe(false);
    expect(takeAdminCommand('addDownloadClient')).toBe(true);
    expect(takeAdminCommand('addDownloadClient')).toBe(false);
  });

  it('tells whoever is listening that an action was asked for, until they stop', () => {
    const listener = vi.fn();
    const stop = listenForAdminCommands(listener);

    requestAdminCommand('addIndexer');

    expect(listener).toHaveBeenCalledOnce();

    stop();
    requestAdminCommand('addIndexer');

    expect(listener).toHaveBeenCalledOnce();
    takeAdminCommand('addIndexer');
  });
});
