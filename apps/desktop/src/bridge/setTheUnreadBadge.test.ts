import { afterEach, describe, expect, it, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import { drawUnreadBadge } from './drawUnreadBadge';
import { setTheUnreadBadge } from './setTheUnreadBadge';

vi.mock('@tauri-apps/api/core', () => ({ invoke: vi.fn() }));

vi.mock('./drawUnreadBadge', () => ({ drawUnreadBadge: vi.fn() }));

afterEach(() => {
  vi.mocked(invoke).mockReset();
  vi.mocked(drawUnreadBadge).mockReset();
});

describe('setTheUnreadBadge', () => {
  it('hands over the count alone where the system draws its own badge', () => {
    vi.mocked(invoke).mockResolvedValue(null);

    setTheUnreadBadge(3, 'darwin');

    expect(invoke).toHaveBeenCalledWith('set_unread_badge', { count: 3, picture: null });
    expect(drawUnreadBadge).not.toHaveBeenCalled();
  });

  it('draws the picture Windows lays over the taskbar button, and hands it over with the count', async () => {
    vi.mocked(invoke).mockResolvedValue(null);
    vi.mocked(drawUnreadBadge).mockResolvedValue('data:image/png;base64,AAAA');

    setTheUnreadBadge(4, 'win32');

    await vi.waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('set_unread_badge', {
        count: 4,
        picture: 'data:image/png;base64,AAAA',
      });
    });
    expect(drawUnreadBadge).toHaveBeenCalledWith(4);
  });
});
