import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { MediaSummary } from '@ValenceContracts/schemas/Library';
import { useDismissWithUndo } from './useDismissWithUndo';

const serverHas = vi.hoisted(() => vi.fn<() => boolean | null>());

const dismissInPlace = vi.hoisted(() =>
  vi.fn<(cache: QueryClient, mediaId: string, isDismissed: boolean) => Promise<boolean>>(),
);

const notify = vi.hoisted(() => ({
  worked:
    vi.fn<
      (message: string, notice?: { action?: { label: string; onPress: () => void } }) => void
    >(),
  failed: vi.fn<(message: string) => void>(),
}));

vi.mock('@ValenceClient/about/useServerHas', () => ({ useServerHas: serverHas }));
vi.mock('@ValenceClient/library/dismissInPlace', () => ({ dismissInPlace }));
vi.mock('@ValenceUI/notify', () => ({ notify }));

const EPISODE: MediaSummary = {
  id: '00000000-0000-4000-8000-000000000001',
  libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title: 'Pilot',
  year: 2026,
  durationSeconds: 1500,
  width: 1920,
  height: 1080,
  videoCodec: 'h264',
  videoRange: 'SDR',
  addedAt: '2026-09-01T00:00:00.000Z',
  hasPoster: false,
  hasBackdrop: false,
  hasLogo: false,
  seriesId: 'a-show',
  seriesTitle: 'The Show',
};

/**
 * Renders the hook inside a query cache of its own.
 *
 * @returns The hook's answer.
 */
const render = () => {
  const cache = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={cache}>{children}</QueryClientProvider>
  );

  return renderHook(() => useDismissWithUndo(), { wrapper }).result;
};

beforeEach(() => {
  serverHas.mockReset();
  serverHas.mockReturnValue(true);
  dismissInPlace.mockReset();
  dismissInPlace.mockResolvedValue(true);
  notify.worked.mockReset();
  notify.failed.mockReset();
});

describe('useDismissWithUndo', () => {
  it('offers nothing where the server cannot take things off the row', () => {
    serverHas.mockReturnValue(false);

    expect(render().current).toBeNull();
  });

  it('takes it off and says so by the programme’s name, with a way to put it back', async () => {
    render().current?.(EPISODE);

    await waitFor(() => {
      expect(notify.worked).toHaveBeenCalledOnce();
    });

    const [message, notice] = notify.worked.mock.calls[0] ?? [];

    expect(message).toBe('Removed The Show from Continue watching');
    expect(notice?.action?.label).toBe('Undo');
    expect(dismissInPlace).toHaveBeenCalledWith(expect.anything(), EPISODE.id, true);

    notice?.action?.onPress();

    expect(dismissInPlace).toHaveBeenLastCalledWith(expect.anything(), EPISODE.id, false);
  });

  it('says so where putting it back fails', async () => {
    render().current?.(EPISODE);

    await waitFor(() => {
      expect(notify.worked).toHaveBeenCalledOnce();
    });

    dismissInPlace.mockResolvedValue(false);
    notify.worked.mock.calls[0]?.[1]?.action?.onPress();

    await waitFor(() => {
      expect(notify.failed).toHaveBeenCalledWith('Couldn’t do that. Try again in a moment.');
    });
  });

  it('says so where the server would not take it off', async () => {
    dismissInPlace.mockResolvedValue(false);

    render().current?.(EPISODE);

    await waitFor(() => {
      expect(notify.failed).toHaveBeenCalledWith(
        'Couldn’t remove The Show from Continue watching. Try again.',
      );
    });
    expect(notify.worked).not.toHaveBeenCalled();
  });
});
