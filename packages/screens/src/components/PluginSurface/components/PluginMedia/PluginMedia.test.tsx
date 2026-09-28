import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { PluginMedia } from './PluginMedia';

const fetchMediaDetail = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/library/fetchLibrary', async (importOriginal) => ({
  ...(await importOriginal<Record<string, () => void>>()),
  fetchMediaDetail,
}));

describe('PluginMedia', () => {
  it('draws the title as the library has it, and opens it when pressed', async () => {
    fetchMediaDetail.mockResolvedValue({
      id: 'm1',
      title: 'Frieren',
      year: 2023,
      metadata: { seriesTitle: null },
    });

    renderInAnAddress(<PluginMedia mediaId="m1" />);

    await userEvent.click(await screen.findByRole('button', { name: /Frieren/u }));

    await waitFor(() => {
      expect(window.location.search).toContain('m1');
    });
  });

  it('draws nothing for a title the library does not have', async () => {
    fetchMediaDetail.mockResolvedValue(null);

    renderInAnAddress(<PluginMedia mediaId="gone" />);

    await waitFor(() => {
      expect(fetchMediaDetail).toHaveBeenCalledWith('gone');
    });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
