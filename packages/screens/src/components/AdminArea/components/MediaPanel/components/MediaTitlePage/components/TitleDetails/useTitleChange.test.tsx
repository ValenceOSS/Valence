import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { adminQueries } from '@ValenceClient/query/adminQueries';
import { notify } from '@ValenceUI/notify';
import { useTitleChange } from './useTitleChange';
import type { ReactNode } from 'react';

const { edit, undo } = vi.hoisted(() => ({ edit: vi.fn(), undo: vi.fn() }));

vi.mock('@ValenceClient/admin/fetchTitleMetadata', () => ({
  editTitleMetadata: edit,
  undoTitleChange: undo,
}));
vi.mock('@ValenceUI/notify', () => ({ notify: { worked: vi.fn(), failed: vi.fn() } }));

const METADATA = {
  subject: { kind: 'film' as const, key: 'movie:603', libraryId: 'lib', isMatched: true },
  fields: { title: { value: 'Mine', source: 'edited' as const } },
};

/**
 * The hook inside a query cache of its own.
 *
 * @returns The hook and the cache.
 */
const hooked = () => {
  const cache = new QueryClient();
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={cache}>{children}</QueryClientProvider>
  );

  return { ...renderHook(() => useTitleChange('a', 'title'), { wrapper }), cache };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('useTitleChange', () => {
  it('takes the title as the server answers it, and says so in one toast with an undo', async () => {
    edit.mockResolvedValue({ kind: 'saved', outcome: { changeSetId: 'set', metadata: METADATA } });

    const { result, cache } = hooked();
    let outcome: { isSaved: boolean } = { isSaved: false };

    await act(async () => {
      outcome = await result.current.change({ set: { title: 'Mine' } });
    });

    expect(outcome.isSaved).toBe(true);
    expect(cache.getQueryData(adminQueries.titleMetadata('a', 'title').queryKey)).toEqual(METADATA);
    expect(vi.mocked(notify.worked).mock.calls[0]?.[0]).toBe('Saved 1 change');

    await act(async () => {
      await result.current.change({ set: { title: 'Mine again' } });
    });

    expect(vi.mocked(notify.worked).mock.calls[1]?.[0]).toBe('Saved 2 changes');
    expect(vi.mocked(notify.worked).mock.calls[0]?.[1]).toMatchObject({
      id: 'title-metadata-movie:603',
      action: { label: 'Undo' },
    });
  });

  it('says why a change was refused, and keeps quiet', async () => {
    edit.mockResolvedValue({ kind: 'refused', reason: 'No' });

    const { result } = hooked();
    let outcome = { isSaved: true, reason: '' };

    await act(async () => {
      outcome = await result.current.change({ set: { title: '' } });
    });

    expect(outcome).toEqual({ isSaved: false, reason: 'No' });
    expect(notify.worked).not.toHaveBeenCalled();
  });

  it('undoes a change, saying why where it could not', async () => {
    undo.mockResolvedValue({ kind: 'refused', reason: 'Changed since' });

    const { result } = hooked();

    await act(async () => {
      await result.current.undo('set');
    });

    expect(undo).toHaveBeenCalledWith('a', 'title', 'set');
    expect(notify.failed).toHaveBeenCalledWith('Changed since');
  });
});
