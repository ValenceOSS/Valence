import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aPlugin } from '@ValenceClient/testing/aPlugin';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { RemovePluginDialog } from './RemovePluginDialog';

const fetchPluginRemoval = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/plugins/fetchPluginRemoval', () => ({ fetchPluginRemoval }));

const KEPT = {
  bytesKept: 4096,
  people: 1,
  accounts: [{ provider: 'AniList', connected: 1, isRevoked: true }],
  themes: 0,
  nodes: 0,
  webhooks: 0,
  keepsEarlierVersion: false,
};

beforeEach(() => {
  fetchPluginRemoval.mockReset().mockResolvedValue(KEPT);
});

describe('RemovePluginDialog', () => {
  it('lists what goes with the plugin, and offers to turn it off instead', async () => {
    const onTurnOff = vi.fn();
    const onConfirm = vi.fn();

    renderInAnAddress(
      <RemovePluginDialog
        plugin={aPlugin()}
        isBusy={false}
        onClose={vi.fn()}
        onTurnOff={onTurnOff}
        onConfirm={onConfirm}
      />,
    );

    expect(await screen.findByText('4.0 KB of plugin data is deleted.')).toBeInTheDocument();
    expect(
      screen.getByText(
        '1 account connected to AniList is disconnected, and AniList is asked to revoke access.',
      ),
    ).toBeInTheDocument();
    expect(fetchPluginRemoval).toHaveBeenCalledWith('anilist');

    await userEvent.click(screen.getByRole('button', { name: 'Disable plugin' }));
    await userEvent.click(screen.getByRole('button', { name: 'Remove it' }));

    expect(onTurnOff).toHaveBeenCalledOnce();
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('says when it kept nothing, and offers no turning off for a plugin already off', async () => {
    fetchPluginRemoval.mockResolvedValue({ ...KEPT, bytesKept: 0, people: 0, accounts: [] });

    renderInAnAddress(
      <RemovePluginDialog
        plugin={aPlugin({ isEnabled: false })}
        isBusy={false}
        onClose={vi.fn()}
        onTurnOff={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(
      await screen.findByText('It has no saved data and no connected accounts.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Disable plugin' })).not.toBeInTheDocument();
  });

  it('still lets a plugin go when what it kept cannot be read', async () => {
    fetchPluginRemoval.mockRejectedValue(new Error('down'));

    renderInAnAddress(
      <RemovePluginDialog
        plugin={aPlugin()}
        isBusy={false}
        onClose={vi.fn()}
        onTurnOff={vi.fn()}
        onConfirm={vi.fn()}
      />,
    );

    expect(await screen.findByText(/couldn’t list the plugin’s saved data/u)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Remove it' })).toBeEnabled();
  });
});
