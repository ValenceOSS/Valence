import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { aLinkSharing } from '@ValenceClient/testing/aLinkSharing';
import { aLinkedServer } from '@ValenceClient/testing/aLinkedServer';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { LinkedServerDetail } from './LinkedServerDetail';

vi.mock('@ValenceClient/admin/fetchLinkSharing', () => ({
  fetchLinkSharing: () => Promise.resolve(aLinkSharing()),
}));

vi.mock('@ValenceClient/admin/fetchTheirLibraries', () => ({
  fetchTheirLibraries: () => Promise.resolve({ isReachable: true, libraries: [] }),
}));

vi.mock('@ValenceClient/admin/fetchRemotePeople', () => ({
  fetchRemotePeople: () => Promise.resolve([]),
}));

vi.mock('@ValenceClient/admin/fetchLinkActivity', () => ({
  fetchLinkActivity: () => Promise.resolve([]),
}));

vi.mock('@ValenceClient/admin/fetchTheirActivity', () => ({
  fetchTheirActivity: () => Promise.resolve({ standing: 'notShown', entries: [] }),
}));

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchLibraries: () => Promise.resolve([]),
  fetchLibraryItems: vi.fn(),
  fetchMediaDetail: vi.fn(),
}));

describe('LinkedServerDetail', () => {
  it('draws everything between this server and a linked one', async () => {
    renderInAnAddress(
      <LinkedServerDetail server={aLinkedServer({ state: 'linked' })} thisServer="Anime" />,
    );

    expect(await screen.findByText('What Films can see')).toBeInTheDocument();
    expect(screen.getByText('What Films shares with you')).toBeInTheDocument();
    expect(screen.getByText('People from Films')).toBeInTheDocument();
    expect(screen.getByText('What Films asked for')).toBeInTheDocument();
    expect(screen.getByText('Their record of your people')).toBeInTheDocument();
  });
});
