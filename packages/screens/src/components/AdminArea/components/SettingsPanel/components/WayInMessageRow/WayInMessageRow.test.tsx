import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WayInMessageRow } from './WayInMessageRow';

const saveWayInMessage = vi.hoisted(() =>
  vi.fn<(message: { text: string; colour: string | null } | null) => Promise<boolean>>(() =>
    Promise.resolve(true),
  ),
);

vi.mock('@ValenceClient/admin/fetchAdmin', () => ({ saveWayInMessage }));

beforeEach(() => {
  saveWayInMessage.mockClear();
});

describe('WayInMessageRow', () => {
  it('saves a message in the colour typed', async () => {
    const user = userEvent.setup();

    render(<WayInMessageRow message={null} />);

    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Welcome home');
    await user.type(screen.getByRole('textbox', { name: 'Colour' }), '#FF8800');
    await user.click(screen.getByRole('button', { name: 'Save message' }));

    expect(saveWayInMessage).toHaveBeenCalledWith({ text: 'Welcome home', colour: '#FF8800' });
  });

  it('saves a message in the theme’s own colour where none is typed', async () => {
    const user = userEvent.setup();

    render(<WayInMessageRow message={null} />);

    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Save message' }));

    expect(saveWayInMessage).toHaveBeenCalledWith({ text: 'Hello', colour: null });
  });

  it('will not save a colour that is not a hex code', async () => {
    const user = userEvent.setup();

    render(<WayInMessageRow message={null} />);

    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Hello');
    await user.type(screen.getByRole('textbox', { name: 'Colour' }), 'orange');

    expect(screen.getByText('Use a six digit hex code, such as #FF8800.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save message' })).toBeDisabled();
  });

  it('takes a message away', async () => {
    const user = userEvent.setup();

    render(<WayInMessageRow message={{ text: 'Welcome', colour: null }} />);

    await user.click(screen.getByRole('button', { name: 'Remove' }));

    expect(saveWayInMessage).toHaveBeenCalledWith(null);
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Remove' })).not.toBeInTheDocument();
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WayInMessageRow.displayName).toBe('WayInMessageRow');
  });
});
