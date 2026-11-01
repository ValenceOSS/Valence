import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { AppPasswordSection } from './AppPasswordSection';
import type { AppPasswords, MadeAppPassword } from '@ValenceContracts/schemas/Plugin';

const fetchAppPasswords = vi.fn<(pluginId: string) => Promise<AppPasswords>>();
const makeAppPassword = vi.fn<(pluginId: string, label: string) => Promise<MadeAppPassword>>();
const removeAppPassword = vi.fn<(pluginId: string, passwordId: string) => Promise<void>>();

vi.mock('@ValenceClient/plugins/fetchAppPasswords', () => ({
  fetchAppPasswords: (pluginId: string) => fetchAppPasswords(pluginId),
}));

vi.mock('@ValenceClient/plugins/makeAppPassword', () => ({
  makeAppPassword: (pluginId: string, label: string) => makeAppPassword(pluginId, label),
}));

vi.mock('@ValenceClient/plugins/removeAppPassword', () => ({
  removeAppPassword: (pluginId: string, passwordId: string) =>
    removeAppPassword(pluginId, passwordId),
}));

const ADDRESS = 'https://valence.test/api/plugins/music/routes';

const PHONE = {
  id: '00000000-0000-4000-8000-000000000001',
  login: 'sam',
  label: 'Phone',
  createdAt: '2026-10-31T10:00:00.000Z',
  lastUsedAt: null,
};

beforeEach(() => {
  fetchAppPasswords.mockReset().mockResolvedValue({
    address: ADDRESS,
    routes: [{ id: 'rest', title: 'Music apps' }],
    passwords: [],
  });
  makeAppPassword
    .mockReset()
    .mockResolvedValue({ address: ADDRESS, password: PHONE, secret: 'q8Zr1VbW3nK0yTf6LmP2sXhD' });
  removeAppPassword.mockReset().mockResolvedValue();
});

describe('AppPasswordSection', () => {
  it('says what app passwords are for, and that there are none yet', async () => {
    renderInAnAddress(<AppPasswordSection pluginId="music" pluginName="Music apps" />);

    expect(await screen.findByText('No app passwords yet.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Music apps' })).toBeInTheDocument();
    expect(screen.getByText(ADDRESS)).toBeInTheDocument();
    expect(screen.getByText(/It answers Music apps\./u)).toBeInTheDocument();
    expect(fetchAppPasswords).toHaveBeenCalledWith('music');
  });

  it('makes a password for what somebody typed, and shows its address, username and secret once', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AppPasswordSection pluginId="music" pluginName="Music apps" />);

    await user.type(await screen.findByRole('textbox', { name: 'What is it for?' }), 'Phone');
    await user.click(screen.getByRole('button', { name: 'Make app password' }));

    expect(makeAppPassword).toHaveBeenCalledWith('music', 'Phone');
    expect(await screen.findByText('q8Zr1VbW3nK0yTf6LmP2sXhD')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Copy Password' })).toBeInTheDocument();
    expect(screen.getByText('Copy the password now. It won’t be shown again.')).toBeInTheDocument();
  });

  it('removes a password only once somebody says so', async () => {
    const user = userEvent.setup();

    fetchAppPasswords.mockResolvedValue({ address: ADDRESS, routes: [], passwords: [PHONE] });
    renderInAnAddress(<AppPasswordSection pluginId="music" pluginName="Music apps" />);

    await user.click(await screen.findByRole('button', { name: 'Remove Phone' }));

    expect(removeAppPassword).not.toHaveBeenCalled();
    expect(
      screen.getByText(
        'The app password “Phone” stops working, and the app using it is signed out of Music apps.',
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Remove it' }));

    await waitFor(() => {
      expect(removeAppPassword).toHaveBeenCalledWith('music', PHONE.id);
    });
  });

  it('stops showing a password just made once it is removed', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<AppPasswordSection pluginId="music" pluginName="Music apps" />);

    await user.type(await screen.findByRole('textbox', { name: 'What is it for?' }), 'Phone');
    fetchAppPasswords.mockResolvedValue({ address: ADDRESS, routes: [], passwords: [PHONE] });
    await user.click(screen.getByRole('button', { name: 'Make app password' }));
    expect(await screen.findByText('q8Zr1VbW3nK0yTf6LmP2sXhD')).toBeInTheDocument();

    await user.click(await screen.findByRole('button', { name: 'Remove Phone' }));
    await user.click(screen.getByRole('button', { name: 'Remove it' }));

    await waitFor(() => {
      expect(screen.queryByText('q8Zr1VbW3nK0yTf6LmP2sXhD')).not.toBeInTheDocument();
    });
  });

  it('says where the passwords could not be read', async () => {
    fetchAppPasswords.mockRejectedValue(new Error('offline'));

    renderInAnAddress(<AppPasswordSection pluginId="music" pluginName="Music apps" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Your app passwords couldn’t be read.',
    );
  });
});
