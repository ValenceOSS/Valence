import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { fetchAnnouncement } from './fetchAnnouncement';
import { useAnnouncement } from './useAnnouncement';

vi.mock('./fetchAnnouncement', () => ({ fetchAnnouncement: vi.fn() }));

const announcement = {
  id: 'a',
  text: 'Back at six',
  severity: 'info' as const,
  endsAt: null,
  postedAt: '2026-10-15T09:00:00.000Z',
};

beforeEach(() => {
  installPlatform(aFakePlatform());
  vi.mocked(fetchAnnouncement).mockResolvedValue(announcement);
});

describe('useAnnouncement', () => {
  it('shows the announcement up for everybody', async () => {
    const { result } = renderHook(() => useAnnouncement(), { wrapper: CacheScope });

    await waitFor(() => {
      expect(result.current.announcement).toEqual(announcement);
    });
  });

  it('keeps an announcement away once it is put away', async () => {
    const { result } = renderHook(() => useAnnouncement(), { wrapper: CacheScope });

    await waitFor(() => {
      expect(result.current.announcement).not.toBeNull();
    });

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.announcement).toBeNull();
  });

  it('shows a different announcement after one was put away', async () => {
    const { result, unmount } = renderHook(() => useAnnouncement(), { wrapper: CacheScope });

    await waitFor(() => {
      expect(result.current.announcement).not.toBeNull();
    });

    act(() => {
      result.current.dismiss();
    });
    unmount();

    vi.mocked(fetchAnnouncement).mockResolvedValue({ ...announcement, id: 'b' });

    const again = renderHook(() => useAnnouncement(), { wrapper: CacheScope });

    await waitFor(() => {
      expect(again.result.current.announcement?.id).toBe('b');
    });
  });
});
