import { afterEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { tellTheHost } from './tellTheHost';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

afterEach(() => {
  vi.mocked(invoke).mockReset();
});

describe('tellTheHost', () => {
  it('sends the host the command and what goes with it', () => {
    vi.mocked(invoke).mockResolvedValue(null);

    tellTheHost('preferences_write', { key: 'a', value: 'b' });

    expect(invoke).toHaveBeenCalledWith('preferences_write', { key: 'a', value: 'b' });
  });

  it('minds nothing the host says back, a refusal included', async () => {
    vi.mocked(invoke).mockRejectedValue(new Error('not allowed'));

    expect(() => {
      tellTheHost('frame_close');
    }).not.toThrow();

    await expect(vi.mocked(invoke).mock.results[0]?.value).rejects.toThrow('not allowed');
  });
});
