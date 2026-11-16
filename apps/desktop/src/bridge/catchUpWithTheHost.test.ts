import { afterEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { catchUpWithTheHost } from './catchUpWithTheHost';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

afterEach(() => {
  vi.mocked(invoke).mockReset();
});

/**
 * Makes somewhere to keep each answer, to see what was kept.
 *
 * @returns The keepers.
 */
const keepers = () => ({ reach: vi.fn(), update: vi.fn(), frame: vi.fn() });

describe('catchUpWithTheHost', () => {
  it('keeps how things stand now, as the host says', async () => {
    vi.mocked(invoke).mockResolvedValue({
      isReachable: false,
      update: { kind: 'available', version: '2.0.0' },
      frame: { isMaximised: true, isFullScreen: false },
    });
    const keep = keepers();

    await catchUpWithTheHost(keep);

    expect(invoke).toHaveBeenCalledWith('what_is_now');
    expect(keep.reach).toHaveBeenCalledWith(false);
    expect(keep.update).toHaveBeenCalledWith({ kind: 'available', version: '2.0.0' });
    expect(keep.frame).toHaveBeenCalledWith({ isMaximised: true, isFullScreen: false });
  });

  it('keeps nothing where the host gives an answer it cannot read', async () => {
    vi.mocked(invoke).mockResolvedValue({ isReachable: 'yes' });
    const keep = keepers();

    await catchUpWithTheHost(keep);

    expect(keep.reach).not.toHaveBeenCalled();
    expect(keep.update).not.toHaveBeenCalled();
    expect(keep.frame).not.toHaveBeenCalled();
  });

  it('keeps nothing where the host does not answer', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('not allowed'));
    const keep = keepers();

    await catchUpWithTheHost(keep);

    expect(keep.reach).not.toHaveBeenCalled();
  });
});
