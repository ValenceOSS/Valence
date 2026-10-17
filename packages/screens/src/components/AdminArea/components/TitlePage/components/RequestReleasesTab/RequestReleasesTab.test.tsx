import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { aRelease } from '@ValenceClient/testing/aRelease';
import { parseReleaseName } from '@ValenceCore/releases/parseReleaseName';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { RequestReleasesTab } from './RequestReleasesTab';
import type { Release } from '@ValenceContracts/schemas/Indexer';

const HARUHI = aRelease('[Victor1139] The Melancholy of Haruhi Suzumiya (2006) [576p]');

const OTHER = aRelease('A Tale of the Secret Saint S01E04 1080p CR WEB-DL');

/**
 * A verdict on a release, refused where a code is given.
 */
const judged = (release: Release, code: string | null) => ({
  releaseId: release.id,
  parsed: parseReleaseName(release.title),
  quality: 1,
  score: 0,
  isRejected: code !== null,
  rejections:
    code === null ? [] : [{ code, message: 'Its name doesn’t match this title', values: {} }],
  reasons: [],
});

vi.mock('@ValenceClient/requests/fetchMediaRequests', () => ({
  fetchMediaRequestReleases: () =>
    Promise.resolve({
      releases: [HARUHI, OTHER],
      indexers: [],
      judgements: [
        judged(HARUHI, null),
        judged(OTHER, 'requests.mediaRequests.judgeForRequest.itsNameDoesNotSayItIs'),
      ],
      pickedId: HARUHI.id,
    }),
  pickMediaRelease: vi.fn(),
}));

describe('RequestReleasesTab', () => {
  it('leaves out the releases that are some other title until they are asked for', async () => {
    const user = userEvent.setup();

    renderInAnAddress(
      <RequestReleasesTab
        request={aMediaRequest({ kind: 'series', title: 'The Melancholy of Haruhi Suzumiya' })}
        onPicked={vi.fn()}
      />,
    );

    expect(await screen.findByText(HARUHI.title)).toBeInTheDocument();
    expect(screen.queryByText(OTHER.title)).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show 1 release that isn’t this title' }));

    expect(screen.getByText(OTHER.title)).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Hide the releases that aren’t this title' }),
    );

    expect(screen.queryByText(OTHER.title)).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(RequestReleasesTab.displayName).toBe('RequestReleasesTab');
  });
});
