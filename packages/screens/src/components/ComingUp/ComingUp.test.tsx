import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ComingUp } from './ComingUp';
import type { ComingUp as ComingUpList } from '@ValenceContracts/schemas/Show';

const fetchComingUp = vi.hoisted(() => vi.fn<() => Promise<ComingUpList['shows']>>());

vi.mock('@ValenceClient/library/fetchShows', () => ({ fetchComingUp }));

const SHOW = {
  id: 'ted-lasso',
  libraryId: '3f2504e0-4f89-41d3-9a0c-0305e82c3301',
  title: 'Ted Lasso',
  seasonCount: 3,
  episodeCount: 30,
  latestAddedAt: '2026-09-01T00:00:00.000Z',
  coverMediaId: '9c858901-8a57-4791-81fe-4c455b099bc9',
  seriesId: null,
};

beforeEach(() => {
  fetchComingUp.mockReset();
});

describe('ComingUp', () => {
  it('says which episode of each programme is next, and when it airs', async () => {
    fetchComingUp.mockResolvedValue([
      {
        show: SHOW,
        episode: { seasonNumber: 4, episodeNumber: 2, title: 'Two', airDate: '2999-01-01' },
      },
    ]);

    renderInAnAddress(<ComingUp onOpenShow={vi.fn()} />);

    expect(await screen.findByText('Ted Lasso')).toBeInTheDocument();
    expect(screen.getByText('S4 E2 · Airs 1 Jan 2999')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Coming up/ })).toBeInTheDocument();
  });

  it('opens the programme when its card is chosen, by its series where it has one', async () => {
    const onOpenShow = vi.fn();

    fetchComingUp.mockResolvedValue([
      {
        show: { ...SHOW, seriesId: '11111111-1111-4111-8111-111111111111' },
        episode: { seasonNumber: 1, episodeNumber: 1, title: 'One', airDate: '2999-01-01' },
      },
    ]);

    renderInAnAddress(<ComingUp onOpenShow={onOpenShow} />);

    await userEvent.click(await screen.findByRole('button', { name: /Ted Lasso/ }));

    expect(onOpenShow).toHaveBeenCalledWith('11111111-1111-4111-8111-111111111111');
  });

  it('opens it by its own id where it has no series', async () => {
    const onOpenShow = vi.fn();

    fetchComingUp.mockResolvedValue([
      {
        show: SHOW,
        episode: { seasonNumber: 1, episodeNumber: 1, title: 'One', airDate: '2999-01-01' },
      },
    ]);

    renderInAnAddress(<ComingUp onOpenShow={onOpenShow} />);

    await userEvent.click(await screen.findByRole('button', { name: /Ted Lasso/ }));

    expect(onOpenShow).toHaveBeenCalledWith('ted-lasso');
  });

  it('draws nothing where nothing is coming', async () => {
    fetchComingUp.mockResolvedValue([]);

    const { container } = renderInAnAddress(<ComingUp onOpenShow={vi.fn()} />);

    await vi.waitFor(() => {
      expect(fetchComingUp).toHaveBeenCalled();
    });

    expect(container.querySelector('h2, h3')).toBeNull();
  });

  it('draws nothing where it could not be read, rather than an error on the front page', async () => {
    fetchComingUp.mockRejectedValue(new Error('offline'));

    renderInAnAddress(<ComingUp onOpenShow={vi.fn()} />);

    await vi.waitFor(() => {
      expect(fetchComingUp).toHaveBeenCalled();
    });

    expect(screen.queryByText('Coming up')).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ComingUp.displayName).toBe('ComingUp');
  });
});
