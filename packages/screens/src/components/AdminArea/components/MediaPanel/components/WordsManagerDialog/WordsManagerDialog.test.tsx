import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { WordsManagerDialog } from './WordsManagerDialog';

const { values, keys, editing, ruling } = vi.hoisted(() => ({
  values: vi.fn(),
  keys: vi.fn(),
  editing: vi.fn(),
  ruling: vi.fn(() => Promise.resolve(null)),
}));

vi.mock('@ValenceClient/admin/fetchTitleValues', () => ({ fetchTitleValues: values }));
vi.mock('@ValenceClient/admin/fetchTitleKeys', () => ({ fetchTitleKeys: keys }));
vi.mock('@ValenceClient/admin/editTitlesInParts', () => ({ editTitlesInParts: editing }));
vi.mock('@ValenceClient/admin/fetchWordRules', () => ({
  fetchWordRules: () => Promise.resolve([]),
}));
vi.mock('@ValenceClient/admin/saveWordRules', () => ({ saveWordRules: ruling }));

const TITLE = { mediaId: '00000000-0000-4000-8000-000000000001', scope: 'title' };

beforeEach(() => {
  values.mockReset().mockResolvedValue({ values: [{ value: 'Sci-Fi', count: 3 }] });
  keys
    .mockReset()
    .mockResolvedValue({ titles: [{ id: 'movie:1', leadId: TITLE.mediaId, kind: 'film' }] });
  editing
    .mockReset()
    .mockResolvedValue({ changeSetId: 's', changed: [TITLE], unchanged: 0, refused: 0 });
});

describe('WordsManagerDialog', () => {
  it('renames a genre on every title in the library that carries it, and on titles scanned later', async () => {
    const user = userEvent.setup();

    render(<WordsManagerDialog libraryId="lib" onClose={vi.fn()} />, { wrapper: CacheScope });

    const name = await screen.findByLabelText('Rename Sci-Fi');

    expect(screen.getByText('3 titles')).toBeInTheDocument();

    await user.clear(name);
    await user.type(name, 'Science Fiction');
    await user.click(screen.getByRole('button', { name: 'Rename' }));

    await waitFor(() => {
      expect(editing).toHaveBeenCalledWith(
        [TITLE],
        { replace: { field: 'genres', find: 'Sci-Fi', with: 'Science Fiction', matchCase: false } },
        'titles',
      );
    });
    expect(keys).toHaveBeenCalledWith(
      expect.objectContaining({ libraryId: 'lib', filters: ['genre:Sci-Fi'] }),
    );
    await waitFor(() => {
      expect(ruling).toHaveBeenCalledWith('lib', [
        { field: 'genres', find: 'Sci-Fi', replace: 'Science Fiction' },
      ]);
    });
  });

  it('takes a tag off every title once asked to, never at the first press', async () => {
    const user = userEvent.setup();

    render(<WordsManagerDialog libraryId="lib" onClose={vi.fn()} />, { wrapper: CacheScope });
    await user.click(await screen.findByRole('button', { name: 'Tags' }));
    await user.click(await screen.findByRole('button', { name: 'Remove Sci-Fi from every title' }));

    expect(editing).not.toHaveBeenCalled();
    expect(await screen.findByText('Remove Sci-Fi from 3 titles?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove from every title' }));

    await waitFor(() => {
      expect(editing).toHaveBeenCalledWith(
        [TITLE],
        { replace: { field: 'tags', find: 'Sci-Fi', with: '', matchCase: false } },
        'titles',
      );
    });
    expect(keys).toHaveBeenCalledWith(expect.objectContaining({ filters: ['tag:Sci-Fi'] }));
  });
});
