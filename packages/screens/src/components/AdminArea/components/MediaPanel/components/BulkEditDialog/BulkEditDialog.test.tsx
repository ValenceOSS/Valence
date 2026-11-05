import { render as renderBare, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { BulkEditDialog } from './BulkEditDialog';
import type { ReactElement } from 'react';

const { reading, editing } = vi.hoisted(() => ({ reading: vi.fn(), editing: vi.fn() }));

vi.mock('@ValenceClient/admin/readTitlesTogether', () => ({ readTitlesTogether: reading }));
vi.mock('@ValenceClient/admin/editTitlesInParts', () => ({ editTitlesInParts: editing }));

const render = (ui: ReactElement) => renderBare(ui, { wrapper: CacheScope });

const TARGETS = [
  { mediaId: '00000000-0000-4000-8000-000000000001', scope: 'title' as const },
  { mediaId: '00000000-0000-4000-8000-000000000002', scope: 'title' as const },
];

describe('BulkEditDialog', () => {
  it('says where the titles differ, and saves only the fields touched', async () => {
    reading.mockResolvedValue({
      titles: 2,
      region: 'GB',
      fields: {
        tagline: { value: null, isMixed: true, titles: 2 },
        tags: { value: [], isMixed: false, titles: 2 },
      },
    });
    editing.mockResolvedValue({ changeSetId: 'set', changed: TARGETS, unchanged: 0, refused: 0 });
    const onDone = vi.fn();
    const user = userEvent.setup();

    render(
      <BulkEditDialog
        targets={TARGETS}
        hasShows={false}
        libraryId="lib"
        onClose={vi.fn()}
        onDone={onDone}
      />,
    );

    expect(await screen.findByRole('heading', { name: 'Edit 2 titles' })).toBeInTheDocument();
    expect(await screen.findByLabelText('Tagline')).toHaveAttribute('placeholder', 'Mixed');
    expect(screen.getByText('Change a field to change it on every title.')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Tagline'), 'One line for both');

    expect(screen.getByText('Changes 1 field on 2 titles')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(onDone).toHaveBeenCalled();
    });
    expect(editing).toHaveBeenCalledWith(
      TARGETS,
      { set: { tagline: 'One line for both' } },
      'titles',
      expect.any(Function),
    );
  });

  it('lets a touched field alone again', async () => {
    reading.mockResolvedValue({
      titles: 2,
      fields: { tagline: { value: 'Same', isMixed: false, titles: 2 } },
    });
    const user = userEvent.setup();

    render(
      <BulkEditDialog
        targets={TARGETS}
        hasShows
        libraryId="lib"
        onClose={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    await user.type(await screen.findByLabelText('Tagline'), '!');
    await user.click(screen.getByRole('button', { name: 'Undo this change' }));

    expect(screen.getByRole('button', { name: 'Apply' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Their episodes' })).toBeInTheDocument();
  });

  it('finds and replaces words in a field of every title', async () => {
    reading.mockResolvedValue({
      titles: 2,
      fields: {
        tagline: { value: null, isMixed: true, titles: 2 },
        genres: { value: [], isMixed: true, titles: 2 },
      },
    });
    editing.mockResolvedValue({ changeSetId: 'set', changed: TARGETS, unchanged: 0, refused: 0 });
    const user = userEvent.setup();

    render(
      <BulkEditDialog
        targets={TARGETS}
        hasShows={false}
        libraryId="lib"
        onClose={vi.fn()}
        onDone={vi.fn()}
      />,
    );

    await user.type(await screen.findByLabelText('Find'), 'Sci-Fi');
    await user.type(screen.getByLabelText('Replace with'), 'Science Fiction');

    expect(screen.getByText('Changes 1 field on 2 titles')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(editing).toHaveBeenCalledWith(
        TARGETS,
        {
          replace: { field: 'tagline', find: 'Sci-Fi', with: 'Science Fiction', matchCase: false },
        },
        'titles',
        expect.any(Function),
      );
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(BulkEditDialog.displayName).toBe('BulkEditDialog');
  });
});
