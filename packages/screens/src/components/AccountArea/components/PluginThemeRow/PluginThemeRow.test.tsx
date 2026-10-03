import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { chosenPluginTheme } from '@ValenceClient/plugins/pluginThemeChoice';
import { installATestClient } from '@ValenceScreens/testing/installATestClient';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { PluginThemeRow } from './PluginThemeRow';

const fetchPluginContributions = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/plugins/fetchPluginContributions', () => ({ fetchPluginContributions }));

beforeEach(() => {
  installATestClient();
  fetchPluginContributions.mockReset();
});

describe('PluginThemeRow', () => {
  it('offers the themes plugins add beside Valence’s own, and remembers the choice', async () => {
    fetchPluginContributions.mockResolvedValue({
      pages: [],
      panels: [],
      themes: [
        {
          id: 'deep-sea',
          name: 'Deep sea',
          corners: 'standard',
          dark: undefined,
          light: undefined,
          pluginId: 'midnight',
          pluginName: 'Midnight',
        },
      ],
    });

    renderInAnAddress(<PluginThemeRow />);

    await userEvent.click(await screen.findByRole('button', { name: 'Colours' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: /Deep sea/u }));

    expect(chosenPluginTheme()).toBe('midnight/deep-sea');

    await userEvent.click(screen.getByRole('button', { name: 'Colours' }));
    await userEvent.click(await screen.findByRole('menuitemradio', { name: /Valence/u }));

    expect(chosenPluginTheme()).toBeNull();
  });

  it('is not drawn where no plugin offers a theme', async () => {
    fetchPluginContributions.mockResolvedValue({ pages: [], panels: [], themes: [] });

    renderInAnAddress(<PluginThemeRow />);

    await vi.waitFor(
      () => {
        expect(fetchPluginContributions).toHaveBeenCalled();
      },
      { timeout: 5_000 },
    );

    expect(screen.queryByText('Colours')).not.toBeInTheDocument();
  });
});
