import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { listen } from '@tauri-apps/api/event';
import { fakeTheHostsEvents } from '@ValenceDesktop/testing/fakeTheHostsEvents';
import { hearTheHost } from './hearTheHost';

vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn() }));

afterEach(() => {
  vi.mocked(listen).mockReset();
});

describe('hearTheHost', () => {
  it('passes on what the host says', async () => {
    const host = fakeTheHostsEvents();
    const listener = vi.fn();

    hearTheHost('valence:found', z.string(), listener);
    await vi.waitFor(() => {
      expect(host.listening('valence:found')).toBe(1);
    });
    host.emit('valence:found', 'http://localhost:8420');

    expect(listener).toHaveBeenCalledWith('http://localhost:8420');
  });

  it('passes on nothing that is not what it should be', async () => {
    const host = fakeTheHostsEvents();
    const listener = vi.fn();

    hearTheHost('valence:found', z.string(), listener);
    await vi.waitFor(() => {
      expect(host.listening('valence:found')).toBe(1);
    });
    host.emit('valence:found', 42);

    expect(listener).not.toHaveBeenCalled();
  });

  it('stops listening once told to, and hears nothing after', async () => {
    const host = fakeTheHostsEvents();
    const listener = vi.fn();

    const stop = hearTheHost('valence:found', z.string(), listener);

    stop();
    host.emit('valence:found', 'http://localhost:8420');

    await vi.waitFor(() => {
      expect(host.unlisten).toHaveBeenCalledWith('valence:found');
    });
    expect(listener).not.toHaveBeenCalled();
  });

  it('is not listening for what it was never asked to hear', async () => {
    const host = fakeTheHostsEvents();
    const listener = vi.fn();

    hearTheHost('valence:found', z.string(), listener);
    await vi.waitFor(() => {
      expect(host.listening('valence:found')).toBe(1);
    });
    host.emit('valence:nearby-changed', []);

    expect(host.listening('valence:nearby-changed')).toBe(0);
    expect(listener).not.toHaveBeenCalled();
  });

  it('can still be stopped where the host would not let it listen', async () => {
    vi.mocked(listen).mockRejectedValue(new Error('not allowed'));

    const stop = hearTheHost('valence:found', z.string(), vi.fn());

    expect(stop).not.toThrow();
    await expect(vi.mocked(listen).mock.results[0]?.value).rejects.toThrow('not allowed');
  });
});
