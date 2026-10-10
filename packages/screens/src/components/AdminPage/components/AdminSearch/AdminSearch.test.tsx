import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { takeAdminCommand } from '@ValenceScreens/admin/pendingAdminCommand';
import { AdminSearch } from './AdminSearch';

const SECTIONS = [
  { label: null, items: [{ id: 'overview', label: 'Overview' }] },
  {
    label: 'Requests',
    items: [
      { id: 'downloads', label: 'Downloads' },
      { id: 'indexers', label: 'Indexers' },
    ],
  },
];

describe('AdminSearch', () => {
  it('opens the palette from the bar, and goes to the page chosen', async () => {
    const onGo = vi.fn();
    const user = userEvent.setup();

    render(<AdminSearch sections={SECTIONS} isCompact={false} onGo={onGo} />);

    await user.click(screen.getByRole('button', { name: /Search the admin area/ }));
    await user.click(await screen.findByRole('option', { name: 'Indexers' }));

    expect(onGo).toHaveBeenCalledWith('indexers');
  });

  it('opens from Command or Control and K, from anywhere in the area', async () => {
    render(<AdminSearch sections={SECTIONS} isCompact={false} onGo={vi.fn()} />);

    act(() => {
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }));
    });

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('finds an action forgivingly, and asks its page to carry it out', async () => {
    const onGo = vi.fn();
    const user = userEvent.setup();

    render(<AdminSearch sections={SECTIONS} isCompact={false} onGo={onGo} />);

    await user.click(screen.getByRole('button', { name: /Search the admin area/ }));
    await user.type(await screen.findByRole('combobox'), 'dl clnt');
    await user.click(await screen.findByRole('option', { name: /Add a download client/ }));

    expect(onGo).toHaveBeenCalledWith('downloads');
    expect(takeAdminCommand('addDownloadClient')).toBe(true);
  });

  it('offers only actions whose page this admin can reach', async () => {
    const user = userEvent.setup();

    render(<AdminSearch sections={SECTIONS} isCompact={false} onGo={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: /Search the admin area/ }));
    await user.type(await screen.findByRole('combobox'), 'webhook');

    expect(screen.queryByRole('option', { name: /Create webhook/ })).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AdminSearch.displayName).toBe('AdminSearch');
  });
});
