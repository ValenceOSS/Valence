import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfileNameDialog } from './ProfileNameDialog';

const draw = (onSave = vi.fn(() => Promise.resolve(true)), onClose = vi.fn()) => {
  render(
    <ProfileNameDialog
      title="Rename Sam"
      initialName="Sam"
      isOpen
      onClose={onClose}
      onSave={onSave}
    />,
  );

  return { onSave, onClose, actor: userEvent.setup() };
};

describe('ProfileNameDialog', () => {
  it('starts with what the profile is called now', () => {
    draw();

    expect(screen.getByRole('dialog', { name: 'Rename Sam' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Sam');
  });

  it('saves the new name without the spaces around it, then closes', async () => {
    const { onSave, onClose, actor } = draw();

    await actor.clear(screen.getByLabelText('Name'));
    await actor.type(screen.getByLabelText('Name'), '  Samantha  ');
    await actor.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith('Samantha');

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('stays open where the name was not kept', async () => {
    const { onClose, actor } = draw(vi.fn(() => Promise.resolve(false)));

    await actor.type(screen.getByLabelText('Name'), 'a');
    await actor.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('will not save an empty name', async () => {
    const { onSave, actor } = draw();

    await actor.clear(screen.getByLabelText('Name'));

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await actor.keyboard('{Enter}');

    expect(onSave).not.toHaveBeenCalled();
  });

  it('will not save a name longer than a profile may have', async () => {
    const { actor } = draw();

    await actor.type(screen.getByLabelText('Name'), 'x'.repeat(30));

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('closes without saving on Cancel', async () => {
    const { onSave, onClose, actor } = draw();

    await actor.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('draws nothing while it is shut', () => {
    render(
      <ProfileNameDialog
        title="Rename Sam"
        initialName="Sam"
        isOpen={false}
        onClose={vi.fn()}
        onSave={vi.fn()}
      />,
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ProfileNameDialog.displayName).toBe('ProfileNameDialog');
  });
});
