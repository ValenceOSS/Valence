import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceScreens/testing/aMediaRequest';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { ApproveRequestDialog } from './ApproveRequestDialog';
import type { Library } from '@ValenceContracts/schemas/Library';
import type * as Requests from '@ValenceClient/requests/fetchMediaRequests';
import type * as Profiles from '@ValenceClient/requests/fetchProfiles';
import type * as Libraries from '@ValenceClient/library/fetchLibrary';

const approveMediaRequest = vi.fn<typeof Requests.approveMediaRequest>();
const changeMediaRequest = vi.fn<typeof Requests.changeMediaRequest>();
const fetchProfiles = vi.fn<typeof Profiles.fetchProfiles>();
const fetchLibraries = vi.fn<typeof Libraries.fetchLibraries>();

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  approveMediaRequest: (id: string) => approveMediaRequest(id),
  changeMediaRequest: (...given: Parameters<typeof Requests.changeMediaRequest>) =>
    changeMediaRequest(...given),
  fetchSeriesSeasons: () => Promise.resolve([]),
}));

vi.mock('@ValenceClient/requests/fetchProfiles', () => ({ fetchProfiles: () => fetchProfiles() }));

vi.mock('@ValenceClient/library/fetchLibrary', () => ({
  fetchLibraries: () => fetchLibraries(),
}));

const DUNE = aMediaRequest({ approval: 'awaiting', state: 'awaitingApproval' });

/**
 * A films library, taking requests or not.
 */
const aLibrary = (id: string, name: string, takesRequests = true): Library => ({
  id,
  name,
  kind: 'movies',
  path: `/media/${name.toLowerCase()}`,
  itemCount: 0,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests,
  requestProfileId: null,
  requestPath: null,
});

beforeEach(() => {
  approveMediaRequest.mockReset().mockResolvedValue({ value: DUNE, refusal: null });
  changeMediaRequest.mockReset().mockResolvedValue({ value: DUNE, refusal: null });
  fetchProfiles.mockReset().mockResolvedValue([
    {
      id: '2a9e6679-7425-40de-944b-e07fc1f90ae7',
      name: 'Ultra HD',
      kind: 'video',
      resolutions: [],
      sources: [],
      musicQualities: [],
      smallestMb: null,
      largestMb: null,
      sizes: [],
      preferredWords: [],
      requiredWords: [],
      bannedWords: [],
      isUpgrading: false,
      releaseWait: 'digital',
      upgradeUntilResolution: null,
      upgradeUntilSource: null,
      upgradeUntilMusicQuality: null,
      libraryIds: [],
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    },
  ]);
  fetchLibraries
    .mockReset()
    .mockResolvedValue([
      aLibrary('11111111-1111-4111-8111-111111111111', 'Films'),
      aLibrary('22222222-2222-4222-8222-222222222222', 'Films at the cabin'),
    ]);
});

describe('ApproveRequestDialog', () => {
  it('approves what was asked for as it stands', async () => {
    const user = userEvent.setup();
    const onApproved = vi.fn();

    renderInAnAddress(
      <ApproveRequestDialog request={DUNE} onClose={vi.fn()} onApproved={onApproved} />,
    );

    await user.click(await screen.findByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(approveMediaRequest).toHaveBeenCalledWith(DUNE.id);
    });
    expect(changeMediaRequest).not.toHaveBeenCalled();
    expect(onApproved).toHaveBeenCalled();
  });

  it('saves what an admin changed before approving it', async () => {
    const user = userEvent.setup();

    renderInAnAddress(
      <ApproveRequestDialog request={DUNE} onClose={vi.fn()} onApproved={vi.fn()} />,
    );

    await user.click(await screen.findByRole('button', { name: /Quality/ }));
    await user.click(await screen.findByRole('menuitemradio', { name: 'Ultra HD' }));
    await user.click(screen.getByRole('button', { name: 'Approve' }));

    await waitFor(() => {
      expect(changeMediaRequest).toHaveBeenCalledWith(DUNE.id, {
        profileId: '2a9e6679-7425-40de-944b-e07fc1f90ae7',
      });
    });
    expect(approveMediaRequest).toHaveBeenCalledWith(DUNE.id);
  });

  it('says so where it could not be approved', async () => {
    const user = userEvent.setup();

    approveMediaRequest.mockResolvedValue({
      value: null,
      refusal: { message: 'The service is not answering.' },
    });

    renderInAnAddress(
      <ApproveRequestDialog request={DUNE} onClose={vi.fn()} onApproved={vi.fn()} />,
    );

    await user.click(await screen.findByRole('button', { name: 'Approve' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('The service is not answering.');
  });
});
