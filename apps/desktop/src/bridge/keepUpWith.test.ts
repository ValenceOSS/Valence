import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { listen } from '@tauri-apps/api/event';
import { fakeTheHostsEvents } from '@ValenceDesktop/testing/fakeTheHostsEvents';
import { keepUpWith } from './keepUpWith';

vi.mock('@tauri-apps/api/event', () => ({ listen: vi.fn() }));

afterEach(() => {
  vi.mocked(listen).mockReset();
});

describe('keepUpWith', () => {
  it('starts from what the page was booted with', () => {
    fakeTheHostsEvents();

    expect(keepUpWith('valence:reach-changed', z.boolean(), true).now()).toBe(true);
  });

  it('keeps each change the host announces, and tells whoever follows it', async () => {
    const host = fakeTheHostsEvents();
    const kept = keepUpWith('valence:reach-changed', z.boolean(), true);
    const listener = vi.fn();

    kept.whenChanged(listener);
    await vi.waitFor(() => {
      expect(host.listening('valence:reach-changed')).toBe(1);
    });
    host.emit('valence:reach-changed', false);

    expect(kept.now()).toBe(false);
    expect(listener).toHaveBeenLastCalledWith(false);
  });
});
