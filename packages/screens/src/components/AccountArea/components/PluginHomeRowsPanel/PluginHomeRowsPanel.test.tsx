import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { PluginHomeRowsPanel } from './PluginHomeRowsPanel';

const fetchPluginHomeRowChoices = vi.hoisted(() => vi.fn());
const chooseHomeRow = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/plugins/fetchPluginHomeRowChoices', () => ({
  fetchPluginHomeRowChoices,
}));
vi.mock('@ValenceClient/plugins/chooseHomeRow', () => ({ chooseHomeRow }));

beforeEach(() => {
  fetchPluginHomeRowChoices.mockReset().mockResolvedValue({
    rows: [
      {
        pluginId: 'trending',
        pluginName: 'Trending',
        rowId: 'hot',
        title: 'Hot right now',
        isChosen: false,
      },
    ],
  });
  chooseHomeRow.mockReset().mockResolvedValue(undefined);
});

describe('PluginHomeRowsPanel', () => {
  it('lists each row a plugin offers, named for the plugin, and turns one on', async () => {
    renderInAnAddress(<PluginHomeRowsPanel />);

    expect(await screen.findByText('Hot right now')).toBeInTheDocument();
    expect(screen.getByText('From Trending')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('switch', { name: 'Show Hot right now on Home' }));

    await waitFor(() => {
      expect(chooseHomeRow).toHaveBeenCalledWith('trending', 'hot', true);
    });
  });

  it('draws nothing where no plugin offers a row', async () => {
    fetchPluginHomeRowChoices.mockResolvedValue({ rows: [] });

    const { container } = renderInAnAddress(<PluginHomeRowsPanel />);

    await waitFor(() => {
      expect(fetchPluginHomeRowChoices).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });
});
