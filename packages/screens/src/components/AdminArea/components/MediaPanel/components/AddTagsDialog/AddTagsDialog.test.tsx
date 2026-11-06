import { render as renderBare, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { AddTagsDialog } from './AddTagsDialog';
import type { ReactElement } from 'react';

const { editing } = vi.hoisted(() => ({ editing: vi.fn() }));

vi.mock('@ValenceClient/admin/editTitlesInParts', () => ({ editTitlesInParts: editing }));

const render = (ui: ReactElement) => renderBare(ui, { wrapper: CacheScope });

const TARGETS = [{ mediaId: '00000000-0000-4000-8000-000000000001', scope: 'title' as const }];

describe('AddTagsDialog', () => {
  it('adds the tags typed to every title chosen', async () => {
    editing.mockResolvedValue({ changeSetId: 'set', changed: TARGETS, unchanged: 0, refused: 0 });
    const onDone = vi.fn();
    const user = userEvent.setup();

    render(<AddTagsDialog targets={TARGETS} libraryId="lib" onClose={vi.fn()} onDone={onDone} />);

    expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();

    await user.type(screen.getByLabelText('Tags'), 'heist{Enter}');
    await user.click(screen.getByRole('button', { name: 'Add' }));

    await waitFor(() => {
      expect(onDone).toHaveBeenCalled();
    });
    expect(editing).toHaveBeenCalledWith(TARGETS, { add: { tags: ['heist'] } });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AddTagsDialog.displayName).toBe('AddTagsDialog');
  });
});
