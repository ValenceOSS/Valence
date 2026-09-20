import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * Opens a confirmation with the given overrides.
 */
const open = (overrides: Partial<Parameters<typeof ConfirmDialog>[0]> = {}) => {
  const onClose = vi.fn();
  const onConfirm = vi.fn();

  render(
    <ConfirmDialog
      title="Delete the webhook?"
      detail="It stops receiving events."
      confirmLabel="Delete"
      isOpen
      onClose={onClose}
      onConfirm={onConfirm}
      {...overrides}
    />,
  );

  return { onClose, onConfirm };
};

describe('ConfirmDialog', () => {
  it('says what is about to happen and what it will do', () => {
    open();

    expect(screen.getByRole('heading', { name: 'Delete the webhook?' })).toBeInTheDocument();
    expect(screen.getByText('It stops receiving events.')).toBeInTheDocument();
  });

  it('does the thing once confirmed', async () => {
    const { onConfirm, onClose } = open();

    await userEvent.click(screen.getByRole('button', { name: 'Delete' }));

    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does nothing when cancelled', async () => {
    const { onConfirm, onClose } = open();

    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('paints a destructive answer red, so it never looks like one that can be taken back', () => {
    open({ isDestructive: true });

    const confirm = screen.getByRole('button', { name: 'Delete' });

    expect(confirm).toHaveClass('bg-danger');
    expect(confirm).not.toHaveClass('bg-[var(--surface-hover)]');
  });

  it('paints any other answer white', () => {
    open();

    expect(screen.getByRole('button', { name: 'Delete' })).toHaveClass('bg-[var(--surface-hover)]');
  });

  it('will not be cancelled while the work is running', () => {
    open({ isBusy: true });

    expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();
  });

  it('shows nothing while shut', () => {
    open({ isOpen: false });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ConfirmDialog.displayName).toBe('ConfirmDialog');
  });
});
