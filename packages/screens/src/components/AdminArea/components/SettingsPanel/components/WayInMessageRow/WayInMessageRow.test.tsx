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
  it('saves a message in the colour picked', async () => {
    const user = userEvent.setup();

    render(<WayInMessageRow message={null} />);

    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Welcome home');
    await user.click(screen.getByRole('button', { name: 'Use #e8503a' }));
    await user.click(screen.getByRole('button', { name: 'Save message' }));

    expect(saveWayInMessage).toHaveBeenCalledWith({ text: 'Welcome home', colour: '#e8503a' });
  });

  it('saves a message in the theme’s own colour where none is picked', async () => {
    const user = userEvent.setup();

    render(<WayInMessageRow message={null} />);

    await user.type(screen.getByRole('textbox', { name: 'Message' }), 'Hello');
    await user.click(screen.getByRole('button', { name: 'Save message' }));

    expect(saveWayInMessage).toHaveBeenCalledWith({ text: 'Hello', colour: null });
  });

  it('goes back to the theme’s own colour', async () => {
    const user = userEvent.setup();

    render(<WayInMessageRow message={{ text: 'Hello', colour: '#e8503a' }} />);

    await user.click(screen.getByRole('button', { name: 'Use the theme’s colour' }));
    await user.click(screen.getByRole('button', { name: 'Save message' }));

    expect(saveWayInMessage).toHaveBeenCalledWith({ text: 'Hello', colour: null });
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
