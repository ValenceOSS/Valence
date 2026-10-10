import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { aCatalogueEntry } from '@ValenceClient/testing/aCatalogueEntry';
import { aMediaRequest } from '@ValenceClient/testing/aMediaRequest';
import { aRequestItem } from '@ValenceClient/testing/aRequestItem';
import { renderInAShell } from '@ValenceScreens/testing/renderInAShell';
import { FollowAllDialog } from './FollowAllDialog';
import type { FollowAllDialogProps } from './FollowAllDialog.types';
import type * as Following from '@ValenceClient/requests/followEveryTitle';

const followEveryTitle = vi.hoisted(() => vi.fn<typeof Following.followEveryTitle>());

vi.mock('@ValenceClient/requests/followEveryTitle', () => ({ followEveryTitle }));

const LIBRARIES = [
  { id: 'films', name: 'Films', takesRequests: true },
  { id: 'shows', name: 'Shows', takesRequests: true },
  { id: 'archive', name: 'Archive', takesRequests: false },
];

const ENTRIES = [
  aCatalogueEntry({ key: 'film:1', catalogueId: '1' }),
  aCatalogueEntry({ key: 'film:2', catalogueId: '2' }),
  aCatalogueEntry({ key: 'film:3', catalogueId: '3', status: 'library' }),
  aCatalogueEntry({
    key: 'series:4',
    tab: 'shows',
    kind: 'series',
    catalogueId: '4',
    libraryId: 'shows',
  }),
  aCatalogueEntry({ key: 'film:5', catalogueId: '5', libraryId: 'archive' }),
];

/**
 * Draws the dialog open over the titles given.
 *
 * @param overrides - What to change.
 * @returns What it was told.
 */
const draw = (overrides: Partial<FollowAllDialogProps> = {}) => {
  const told = { onClose: vi.fn(), onFollowed: vi.fn() };

  renderInAShell(
    <FollowAllDialog isOpen entries={ENTRIES} libraries={LIBRARIES} {...told} {...overrides} />,
  );

  return told;
};

beforeEach(() => {
  followEveryTitle.mockReset();
});

describe('FollowAllDialog', () => {
  it('says how many titles from each library it will follow, and what it leaves alone', () => {
    draw();

    expect(screen.getByText('Films')).toBeInTheDocument();
    expect(screen.getByText('2 films')).toBeInTheDocument();
    expect(screen.getByText('1 show')).toBeInTheDocument();
    expect(
      screen.getByText(
        '1 more title is in a library that doesn’t take requests, so it’s left as it is.',
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText('Archive')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Follow 3 titles' })).toBeInTheDocument();
  });

  it('follows them, then says how much is still to find', async () => {
    const actor = userEvent.setup();

    followEveryTitle.mockImplementation((titles, onProgress) => {
      onProgress(titles.length);

      return Promise.resolve({
        followed: [
          aMediaRequest({ kind: 'film', items: [aRequestItem({ state: 'available' })] }),
          aMediaRequest({
            kind: 'series',
            items: [aRequestItem({ state: 'wanted' }), aRequestItem({ state: 'wanted' })],
          }),
        ],
        failed: 1,
      });
    });

    const told = draw();

    await actor.click(screen.getByRole('button', { name: 'Follow 3 titles' }));

    expect(await screen.findByText('Followed 2 titles')).toBeInTheDocument();
    expect(followEveryTitle.mock.calls[0]?.[0].map((entry) => entry.key)).toEqual([
      'film:1',
      'film:2',
      'series:4',
    ]);
    expect(screen.getByText('Episodes still to find').nextSibling).toHaveTextContent('2');
    expect(screen.getByText('Couldn’t be followed').nextSibling).toHaveTextContent('1');
    expect(told.onFollowed).toHaveBeenCalledOnce();

    await actor.click(screen.getByRole('button', { name: 'Done' }));

    expect(told.onClose).toHaveBeenCalledOnce();
  });

  it('stops starting more when Stop is pressed, rather than closing', async () => {
    const actor = userEvent.setup();
    let isStopped: () => boolean = () => false;

    followEveryTitle.mockImplementation((_titles, _onProgress, stopped) => {
      isStopped = stopped ?? isStopped;

      return new Promise(() => undefined);
    });

    const told = draw();

    await actor.click(screen.getByRole('button', { name: 'Follow 3 titles' }));
    await actor.click(await screen.findByRole('button', { name: 'Stop' }));

    await waitFor(() => {
      expect(isStopped()).toBe(true);
    });
    expect(told.onClose).not.toHaveBeenCalled();
  });

  it('says when there is nothing left to follow', () => {
    draw({ entries: [aCatalogueEntry({ status: 'library' })] });

    expect(
      screen.getByText('Every title in the libraries is already followed.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /^Follow/ })).not.toBeInTheDocument();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FollowAllDialog.displayName).toBe('FollowAllDialog');
  });
});
