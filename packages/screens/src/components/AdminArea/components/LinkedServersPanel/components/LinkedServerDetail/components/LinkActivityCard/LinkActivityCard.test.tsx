import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aFederationActivity } from '@ValenceClient/testing/aFederationActivity';
import { aLinkedServer } from '@ValenceClient/testing/aLinkedServer';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { LinkActivityCard } from './LinkActivityCard';
import type { FederationActivity, TheirActivity } from '@ValenceContracts/schemas/LinkSharing';

const fetchLinkActivity = vi.fn<() => Promise<FederationActivity[]>>();
const fetchTheirActivity = vi.fn<() => Promise<TheirActivity>>();

vi.mock('@ValenceClient/admin/fetchLinkActivity', () => ({
  fetchLinkActivity: () => fetchLinkActivity(),
}));

vi.mock('@ValenceClient/admin/fetchTheirActivity', () => ({
  fetchTheirActivity: () => fetchTheirActivity(),
}));

const FILMS = aLinkedServer({ state: 'linked' });

beforeEach(() => {
  fetchLinkActivity.mockReset().mockResolvedValue([aFederationActivity()]);
  fetchTheirActivity.mockReset().mockResolvedValue({
    standing: 'shown',
    entries: [aFederationActivity({ personName: 'Dan', mediaTitle: 'Dune' })],
  });
});

describe('LinkActivityCard', () => {
  it('shows both sides of the record', async () => {
    renderInAnAddress(<LinkActivityCard server={FILMS} thisServer="Anime" />);

    expect(await screen.findByText('Sam')).toBeInTheDocument();
    expect(await screen.findByText('Dan')).toBeInTheDocument();
    expect(screen.getByText('What Films asked for')).toBeInTheDocument();
    expect(screen.getByText('Their record of your people')).toBeInTheDocument();
  });

  it('says where the other server does not show its record', async () => {
    fetchTheirActivity.mockResolvedValue({ standing: 'notShown', entries: [] });

    renderInAnAddress(<LinkActivityCard server={FILMS} thisServer="Anime" />);

    expect(
      await screen.findByText('Films does not show this server its record.'),
    ).toBeInTheDocument();
  });

  it('says where the other server could not be reached', async () => {
    fetchTheirActivity.mockResolvedValue({ standing: 'unreachable', entries: [] });

    renderInAnAddress(<LinkActivityCard server={FILMS} thisServer="Anime" />);

    expect(await screen.findByText('Films could not be reached.')).toBeInTheDocument();
  });

  it('says where this server’s own record could not be read', async () => {
    fetchLinkActivity.mockRejectedValue(new Error('no'));

    renderInAnAddress(<LinkActivityCard server={FILMS} thisServer="Anime" />);

    expect(await screen.findByText(/That could not be read\./u)).toBeInTheDocument();
  });
});
