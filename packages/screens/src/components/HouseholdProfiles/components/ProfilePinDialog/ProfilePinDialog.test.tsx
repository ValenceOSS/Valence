import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ProfilePinDialog } from './ProfilePinDialog';

const draw = (onSave = vi.fn(() => Promise.resolve(true)), onClose = vi.fn()) => {
  render(<ProfilePinDialog name="Sam" isOpen onClose={onClose} onSave={onSave} />);

  return { onSave, onClose, actor: userEvent.setup() };
};

const type = async (actor: ReturnType<typeof userEvent.setup>, pin: string, again: string) => {
  await actor.type(screen.getByLabelText('New PIN'), pin);
  await actor.type(screen.getByLabelText('Type the PIN again'), again);
};

describe('ProfilePinDialog', () => {
  it('asks for the new PIN twice, saying whose it is', () => {
    draw();

    expect(screen.getByRole('dialog', { name: 'PIN for Sam' })).toBeInTheDocument();
    expect(screen.getByLabelText('New PIN')).toHaveAccessibleDescription('4 to 8 digits.');
    expect(screen.getByLabelText('Type the PIN again')).toBeInTheDocument();
  });

  it('saves the PIN once both match, then closes', async () => {
    const { onSave, onClose, actor } = draw();

    await type(actor, '1357', '1357');
    await actor.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith('1357');

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('says when the two do not match, and will not save them', async () => {
    const { actor } = draw();

    await type(actor, '1357', '1358');

    expect(screen.getByText('Those PINs don’t match.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('will not save a PIN shorter than four digits', async () => {
    const { actor } = draw();

    await type(actor, '135', '135');

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('keeps only digits, and no more than eight of them', async () => {
    const { actor } = draw();

    await actor.type(screen.getByLabelText('New PIN'), '12ab3456789');

    expect(screen.getByLabelText('New PIN')).toHaveValue('12345678');
  });

  it('stays open where the PIN was not kept', async () => {
    const { onClose, actor } = draw(vi.fn(() => Promise.resolve(false)));

    await type(actor, '1357', '1357');
    await actor.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
    });
    expect(onClose).not.toHaveBeenCalled();
  });

  it('starts empty each time it opens', async () => {
    const onClose = vi.fn();
    const drawn = render(<ProfilePinDialog name="Sam" isOpen onClose={onClose} onSave={vi.fn()} />);

    await userEvent.type(screen.getByLabelText('New PIN'), '1357');

    drawn.rerender(
      <ProfilePinDialog name="Sam" isOpen={false} onClose={onClose} onSave={vi.fn()} />,
    );
    drawn.rerender(<ProfilePinDialog name="Kid" isOpen onClose={onClose} onSave={vi.fn()} />);

    expect(await screen.findByLabelText('New PIN')).toHaveValue('');
  });

  it('closes without saving on Cancel', async () => {
    const { onSave, onClose, actor } = draw();

    await actor.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onClose).toHaveBeenCalled();
    expect(onSave).not.toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ProfilePinDialog.displayName).toBe('ProfilePinDialog');
  });
});
