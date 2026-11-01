import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { RenameDeviceDialog } from './RenameDeviceDialog';

const draw = (
  renamed: string | null = 'Kitchen iPad',
  onRename = vi.fn((_name: string | null) => Promise.resolve()),
  onClose = vi.fn(),
) => {
  render(
    <RenameDeviceDialog
      ownName="iPad Pro"
      renamed={renamed}
      isOpen
      onRename={onRename}
      onClose={onClose}
    />,
  );

  return { onRename, onClose, actor: userEvent.setup() };
};

describe('RenameDeviceDialog', () => {
  it('starts with what its owner already renamed it to', () => {
    draw();

    expect(screen.getByRole('dialog', { name: 'Rename this device' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Kitchen iPad');
  });

  it('starts empty, showing its own name, where it was never renamed', () => {
    draw(null);

    expect(screen.getByLabelText('Name')).toHaveValue('');
    expect(screen.getByLabelText('Name')).toHaveAttribute('placeholder', 'iPad Pro');
  });

  it('says what emptying the name goes back to', () => {
    draw();

    expect(screen.getByText('Leave it empty to go back to iPad Pro.')).toBeInTheDocument();
  });

  it('renames the device without the spaces around the name, then closes', async () => {
    const { onRename, onClose, actor } = draw();

    await actor.clear(screen.getByLabelText('Name'));
    await actor.type(screen.getByLabelText('Name'), '  Living room  ');
    await actor.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(onRename).toHaveBeenCalledWith('Living room');
  });

  it('gives the device back its own name when the field is emptied', async () => {
    const { onRename, onClose, actor } = draw();

    await actor.clear(screen.getByLabelText('Name'));
    await actor.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
    expect(onRename).toHaveBeenCalledWith(null);
  });

  it('will not save a name longer than the server keeps', async () => {
    const { onRename, onClose, actor } = draw(null);

    await actor.type(screen.getByLabelText('Name'), 'x'.repeat(81));
    await actor.click(screen.getByRole('button', { name: 'Save' }));

    expect(onRename).not.toHaveBeenCalled();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('closes without renaming on Cancel', async () => {
    const { onRename, onClose, actor } = draw();

    await actor.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
    expect(onRename).not.toHaveBeenCalled();
  });

  it('draws nothing while it is shut', () => {
    render(
      <RenameDeviceDialog
        ownName="iPad Pro"
        renamed={null}
        isOpen={false}
        onRename={vi.fn()}
        onClose={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RenameDeviceDialog.displayName).toBe('RenameDeviceDialog');
  });
});
