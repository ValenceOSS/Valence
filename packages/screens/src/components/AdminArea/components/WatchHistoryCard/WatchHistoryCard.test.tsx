import { render, screen } from '@testing-library/react';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { WatchHistoryCard } from './WatchHistoryCard';

const fetchRecentViewings = vi.hoisted(() => vi.fn());
const fetchAccounts = vi.hoisted(() => vi.fn());

vi.mock('@ValenceClient/admin/fetchRecentViewings', () => ({ fetchRecentViewings }));
vi.mock('@ValenceClient/admin/fetchAccounts', () => ({ fetchAccounts }));

beforeEach(() => {
  fetchRecentViewings.mockReset();
  fetchAccounts.mockReset();
  fetchAccounts.mockResolvedValue([]);
});

describe('WatchHistoryCard', () => {
  it('says nobody has watched anything only once the history has been read', () => {
    fetchRecentViewings.mockReturnValue(new Promise(() => {}));

    render(<WatchHistoryCard />, { wrapper: CacheScope });

    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
    expect(screen.queryByText('Nobody has watched anything yet.')).not.toBeInTheDocument();
  });

  it('says nobody has watched anything when the history is empty', async () => {
    fetchRecentViewings.mockResolvedValue([]);

    render(<WatchHistoryCard />, { wrapper: CacheScope });

    expect(await screen.findByText('Nobody has watched anything yet.')).toBeInTheDocument();
  });

  it('says the history could not be read, rather than that it is empty, when the server fails', async () => {
    fetchRecentViewings.mockRejectedValue(new Error('gone'));

    render(<WatchHistoryCard />, { wrapper: CacheScope });

    expect(await screen.findByText(/Couldn’t load the history\./)).toBeInTheDocument();
    expect(screen.queryByText('Nobody has watched anything yet.')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(WatchHistoryCard.displayName).toBe('WatchHistoryCard');
  });
});
