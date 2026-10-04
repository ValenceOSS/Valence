import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aLibrary } from '@ValenceClient/testing/aLibrary';
import { aLinkSharing } from '@ValenceClient/testing/aLinkSharing';
import { aLinkedServer } from '@ValenceClient/testing/aLinkedServer';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { SharingCard } from './SharingCard';
import type { Sent } from '@ValenceClient/requests/sendToRequests';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { LinkSharing, LinkSharingChange } from '@ValenceContracts/schemas/LinkSharing';

const fetchLinkSharing = vi.fn<() => Promise<LinkSharing>>();
const fetchLibraries = vi.fn<() => Promise<Library[]>>();
const changeLinkSharing =
  vi.fn<(id: string, change: LinkSharingChange) => Promise<Sent<LinkSharing | null>>>();

vi.mock('@ValenceClient/admin/fetchLinkSharing', () => ({
  fetchLinkSharing: () => fetchLinkSharing(),
}));

vi.mock('@ValenceClient/admin/changeLinkSharing', () => ({
  changeLinkSharing: (id: string, change: LinkSharingChange) => changeLinkSharing(id, change),
}));

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchLibraries: () => fetchLibraries(),
  fetchLibraryItems: vi.fn(),
  fetchMediaDetail: vi.fn(),
}));

const FILMS = aLinkedServer({ state: 'linked' });
const SHARED = aLibrary({ id: '00000000-0000-4000-8000-0000000000f1', name: 'Films' });
const KEPT = aLibrary({ id: '00000000-0000-4000-8000-0000000000f2', name: 'Anime', kind: 'shows' });
const THEIRS = aLibrary({
  id: '00000000-0000-4000-8000-0000000000f3',
  name: 'Cinema',
  linkedServerId: FILMS.id,
});

beforeEach(() => {
  fetchLinkSharing.mockReset().mockResolvedValue(aLinkSharing());
  fetchLibraries.mockReset().mockResolvedValue([SHARED, KEPT, THEIRS]);
  changeLinkSharing.mockReset().mockResolvedValue({ value: aLinkSharing(), refusal: null });
});

describe('SharingCard', () => {
  it('offers only this server’s own libraries, marking those that are shared', async () => {
    renderInAnAddress(<SharingCard server={FILMS} thisServer="Anime" />);

    expect(await screen.findByRole('button', { name: 'Share Films with Films' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: 'Share Anime with Films' })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
    expect(screen.queryByRole('button', { name: 'Share Cinema with Films' })).toBeNull();
  });

  it('shares a library, and stops sharing one', async () => {
    renderInAnAddress(<SharingCard server={FILMS} thisServer="Anime" />);

    await userEvent.click(await screen.findByRole('button', { name: 'Share Anime with Films' }));

    await waitFor(() => {
      expect(changeLinkSharing).toHaveBeenLastCalledWith(FILMS.id, {
        libraryIds: [SHARED.id, KEPT.id],
      });
    });

    await userEvent.click(screen.getByRole('button', { name: 'Share Films with Films' }));

    await waitFor(() => {
      expect(changeLinkSharing).toHaveBeenLastCalledWith(FILMS.id, { libraryIds: [] });
    });
  });

  it('says there is nothing to share where this server has no libraries of its own', async () => {
    fetchLibraries.mockResolvedValue([THEIRS]);

    renderInAnAddress(<SharingCard server={FILMS} thisServer="Anime" />);

    expect(
      await screen.findByText('This server has no libraries to share yet.'),
    ).toBeInTheDocument();
  });

  it.each([
    ['Accept their requests', { takesTheirRequests: true }],
    ['Stream directly from their server', { playsDirect: true }],
    ['Allow downloads', { allowsDownloads: true }],
    ['Let their admin pause and message your people', { takesTheirControls: false }],
  ])('switches %s', async (name, change) => {
    renderInAnAddress(<SharingCard server={FILMS} thisServer="Anime" />);

    await userEvent.click(await screen.findByRole('switch', { name }));

    await waitFor(() => {
      expect(changeLinkSharing).toHaveBeenLastCalledWith(FILMS.id, change);
    });
  });

  it('says where what is shared could not be read', async () => {
    fetchLinkSharing.mockRejectedValue(new Error('no'));

    renderInAnAddress(<SharingCard server={FILMS} thisServer="Anime" />);

    expect(await screen.findByText(/Couldn’t load that\./u)).toBeInTheDocument();
  });
});
