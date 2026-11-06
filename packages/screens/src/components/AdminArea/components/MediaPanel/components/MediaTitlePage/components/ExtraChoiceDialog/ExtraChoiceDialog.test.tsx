import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ExtraChoiceDialog } from './ExtraChoiceDialog';

const { choosing } = vi.hoisted(() => ({
  choosing: vi.fn(() => Promise.resolve({ kind: 'reached', count: 1, jobId: 'job' })),
}));

vi.mock('@ValenceClient/admin/chooseExtra', () => ({ chooseExtra: choosing }));

const FILE = { mediaId: 'file', name: 'making of.mkv', isExtra: false };

describe('ExtraChoiceDialog', () => {
  it('makes a file an extra of the film, of the kind chosen', async () => {
    const onChanged = vi.fn();
    const user = userEvent.setup();

    render(
      <ExtraChoiceDialog
        file={FILE}
        title={{ mediaId: 'film', name: 'A film' }}
        onClose={vi.fn()}
        onChanged={onChanged}
      />,
    );

    await user.click(screen.getByRole('button', { name: /What it is/u }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Behind the scenes' }));
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledWith('job');
    });
    expect(choosing).toHaveBeenCalledWith('file', {
      extraKind: 'behindTheScenes',
      parentId: 'film',
    });
  });

  it('goes by its name and folder again unless told otherwise', async () => {
    const user = userEvent.setup();

    render(
      <ExtraChoiceDialog
        file={FILE}
        title={{ mediaId: 'film', name: 'A film' }}
        onClose={vi.fn()}
        onChanged={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: 'Apply' }));

    await waitFor(() => {
      expect(choosing).toHaveBeenLastCalledWith('file', {
        extraKind: null,
        parentId: null,
        isForgotten: true,
      });
    });
  });
});
