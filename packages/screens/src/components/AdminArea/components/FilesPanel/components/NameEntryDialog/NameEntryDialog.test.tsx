import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { NameEntryDialog } from './NameEntryDialog';

/**
 * Draws the dialog open, asking to rename a file.
 *
 * @param onName - What it tells the name to.
 * @returns What it was told.
 */
const draw = (onName = vi.fn().mockResolvedValue(null)) => {
  const onClose = vi.fn();

  render(
    <NameEntryDialog
      isOpen
      title="Rename Arrival.mkv"
      initialName="Arrival.mkv"
      confirmLabel="Rename"
      onClose={onClose}
      onName={onName}
    />,
  );

  return { onName, onClose };
};

describe('NameEntryDialog', () => {
  it('starts on the name it was given, and will not save it unchanged or blank', async () => {
    const actor = userEvent.setup();

    draw();

    expect(screen.getByLabelText('Name')).toHaveValue('Arrival.mkv');
    expect(screen.getByRole('button', { name: 'Rename' })).toBeDisabled();

    await actor.clear(screen.getByLabelText('Name'));

    expect(screen.getByRole('button', { name: 'Rename' })).toBeDisabled();
  });

  it('says the new name, trimmed', async () => {
    const actor = userEvent.setup();
    const { onName } = draw();

    await actor.clear(screen.getByLabelText('Name'));
    await actor.type(screen.getByLabelText('Name'), ' Arrival (2016).mkv ');
    await actor.click(screen.getByRole('button', { name: 'Rename' }));

    expect(onName).toHaveBeenCalledWith('Arrival (2016).mkv');
  });

  it('shows why a name would not do, and keeps asking', async () => {
    const actor = userEvent.setup();

    draw(vi.fn().mockResolvedValue('Something of that name is already there.'));

    await actor.type(screen.getByLabelText('Name'), 'x');
    await actor.click(screen.getByRole('button', { name: 'Rename' }));

    await waitFor(() => {
      expect(screen.getByText('Something of that name is already there.')).toBeInTheDocument();
    });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(NameEntryDialog.displayName).toBe('NameEntryDialog');
  });
});
