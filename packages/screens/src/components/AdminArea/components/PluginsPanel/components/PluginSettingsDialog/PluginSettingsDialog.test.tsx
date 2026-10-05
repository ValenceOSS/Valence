import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aPlugin } from '@ValenceClient/testing/aPlugin';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { PluginSettingsDialog } from './PluginSettingsDialog';

const changePlugin = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/plugins/changePlugin', () => ({ changePlugin }));

beforeEach(() => {
  changePlugin.mockReset().mockResolvedValue(undefined);
});

describe('PluginSettingsDialog', () => {
  it('never shows a saved secret, and keeps it unless something new is typed', async () => {
    const onSaved = vi.fn();

    renderInAnAddress(
      <PluginSettingsDialog
        plugin={aPlugin()}
        redirectUri={null}
        onClose={vi.fn()}
        onSaved={onSaved}
      />,
    );

    expect(screen.getByLabelText('Client secret')).toHaveValue('');
    expect(screen.getByPlaceholderText('Saved. Type to replace it.')).toBeInTheDocument();

    await userEvent.clear(screen.getByLabelText('Client id'));
    await userEvent.type(screen.getByLabelText('Client id'), 'new-id');
    await userEvent.click(screen.getByRole('switch', { name: 'Send progress' }));
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(onSaved).toHaveBeenCalled();
    });

    expect(changePlugin).toHaveBeenCalledWith('anilist', {
      settings: { clientId: 'new-id', pushProgress: false },
    });
  });

  it('links a setting to where its value comes from, under its help', () => {
    renderInAnAddress(
      <PluginSettingsDialog
        plugin={aPlugin()}
        redirectUri={null}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByText('Create an app with the redirect address.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'example.com/apps' })).toHaveAttribute(
      'href',
      'https://example.com/apps',
    );
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('sends a secret somebody typed', async () => {
    renderInAnAddress(
      <PluginSettingsDialog
        plugin={aPlugin()}
        redirectUri={null}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    await userEvent.type(screen.getByLabelText('Client secret'), 's3cret');
    await userEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(changePlugin).toHaveBeenCalledWith('anilist', {
        settings: { clientId: 'abc', clientSecret: 's3cret', pushProgress: true },
      });
    });
  });

  it('offers the redirect address to copy, only for a plugin that connects accounts', async () => {
    const writeText = vi.fn(() => Promise.resolve());

    vi.stubGlobal('navigator', { ...navigator, clipboard: { writeText } });

    const address = 'https://valence.test/api/plugins/oauth/callback';
    const { rerender } = renderInAnAddress(
      <PluginSettingsDialog
        plugin={aPlugin()}
        redirectUri={address}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.queryByText(address)).toBeNull();

    rerender(
      <PluginSettingsDialog
        plugin={aPlugin({
          permissions: [
            {
              kind: 'accounts',
              providers: [
                {
                  id: 'anilist',
                  name: 'AniList',
                  authorizeUrl: 'https://anilist.co/api/v2/oauth/authorize',
                  tokenUrl: 'https://anilist.co/api/v2/oauth/token',
                  scopes: [],
                  clientIdSetting: 'clientId',
                },
              ],
            },
          ],
        })}
        redirectUri={address}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByText(address)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Copy' }));

    expect(writeText).toHaveBeenCalledWith(address);
    expect(await screen.findByRole('button', { name: 'Copied' })).toBeInTheDocument();

    vi.unstubAllGlobals();
  });

  it('shows each webhook’s private address, to give to the service that sends it', () => {
    renderInAnAddress(
      <PluginSettingsDialog
        plugin={aPlugin({
          webhooks: [
            {
              id: 'spotify',
              title: 'Spotify changes',
              url: 'https://valence.test/api/plugins/anilist/hooks/spotify/abcdefghijklmnopqrstuvwxyz012345',
            },
          ],
        })}
        redirectUri={null}
        onClose={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(screen.getByText('Spotify changes')).toBeInTheDocument();
    expect(
      screen.getByText(
        'https://valence.test/api/plugins/anilist/hooks/spotify/abcdefghijklmnopqrstuvwxyz012345',
      ),
    ).toBeInTheDocument();
  });
});
