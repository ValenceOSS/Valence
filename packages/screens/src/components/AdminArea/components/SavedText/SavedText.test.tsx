import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SavedText } from './SavedText';

describe('SavedText', () => {
  it('offers to save only once the value changes, and saves it trimmed', async () => {
    const onSave = vi.fn(() => Promise.resolve(true));
    const user = userEvent.setup();

    render(<SavedText label="Name" saved="Alerts" onSave={onSave} />);

    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();

    await user.clear(screen.getByRole('textbox', { name: 'Name' }));
    await user.type(screen.getByRole('textbox', { name: 'Name' }), ' Night alerts ');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onSave).toHaveBeenCalledWith('Night alerts');
  });

  it('says what is wrong with what was typed instead of offering to save it', async () => {
    const user = userEvent.setup();

    render(
      <SavedText
        label="Address"
        saved="https://hooks.example/a"
        onSave={vi.fn(() => Promise.resolve(true))}
        problemOf={(value) => (value.startsWith('http') ? null : 'That isn’t a web address.')}
      />,
    );

    await user.clear(screen.getByRole('textbox', { name: 'Address' }));
    await user.type(screen.getByRole('textbox', { name: 'Address' }), 'hooks');

    expect(screen.getByText('That isn’t a web address.')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Save' })).not.toBeInTheDocument();
  });

  it('keeps what was typed where the save is refused', async () => {
    const user = userEvent.setup();

    render(<SavedText label="Name" saved="Alerts" onSave={() => Promise.resolve(false)} />);

    await user.type(screen.getByRole('textbox', { name: 'Name' }), ' at night');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(screen.getByRole('textbox', { name: 'Name' })).toHaveValue('Alerts at night');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(SavedText.displayName).toBe('SavedText');
  });
});
