import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { EpisodeOrderPicker } from './EpisodeOrderPicker';

const { orders, choosing } = vi.hoisted(() => ({
  orders: vi.fn(),
  choosing: vi.fn(() => Promise.resolve({ kind: 'reached', count: 5, jobId: 'job' })),
}));

vi.mock('@ValenceClient/admin/fetchEpisodeOrders', () => ({ fetchEpisodeOrders: orders }));
vi.mock('@ValenceClient/admin/chooseEpisodeOrder', () => ({ chooseEpisodeOrder: choosing }));

describe('EpisodeOrderPicker', () => {
  it('asks before numbering a show’s episodes by another order', async () => {
    orders.mockResolvedValue({ orders: [{ id: 'dvd', name: 'DVD Order', type: 3 }], chosen: null });

    const onChanged = vi.fn();
    const user = userEvent.setup();

    render(<EpisodeOrderPicker mediaId="file" onChanged={onChanged} />, { wrapper: CacheScope });

    await user.click(await screen.findByRole('button', { name: /Episode order/u }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'DVD Order' }));

    expect(await screen.findByText('Number the episodes by DVD Order?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Use this order' }));

    await waitFor(() => {
      expect(onChanged).toHaveBeenCalledWith('job');
    });
    expect(choosing).toHaveBeenCalledWith('file', 'dvd');
  });

  it('shows nothing for a show TMDB has only its own order for', async () => {
    orders.mockResolvedValue({ orders: [], chosen: null });

    const { container } = render(<EpisodeOrderPicker mediaId="file" onChanged={vi.fn()} />, {
      wrapper: CacheScope,
    });

    await waitFor(() => {
      expect(orders).toHaveBeenCalled();
    });
    expect(container).toBeEmptyDOMElement();
  });
});
