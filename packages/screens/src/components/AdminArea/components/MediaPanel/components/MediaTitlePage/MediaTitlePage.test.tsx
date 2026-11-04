import { render as renderBare, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aMediaSummary } from '@ValenceClient/testing/aMediaSummary';
import { gatherTitles } from '@ValenceScreens/components/AdminArea/components/MediaPanel/gatherTitles';
import { MediaTitlePage } from './MediaTitlePage';
import type { ReactElement } from 'react';
import type { Library } from '@ValenceContracts/schemas/Library';
import type { MediaTitle } from '@ValenceScreens/components/AdminArea/components/MediaPanel/MediaTitle.types';

const { unmatch } = vi.hoisted(() => ({ unmatch: vi.fn() }));

vi.mock('@ValenceClient/admin/unmatchTitle', () => ({ unmatchTitle: unmatch }));

const render = (ui: ReactElement) => renderBare(ui, { wrapper: CacheScope });

const FILMS: Library = {
  id: '00000000-0000-4000-8000-0000000000a1',
  name: 'Films',
  kind: 'movies',
  path: '/media/films',
  itemCount: 2,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
  keepsShowsTogether: true,
  higherProfileAsks: 'ask',
};

const titleOf = (...files: Parameters<typeof aMediaSummary>[0][]): MediaTitle => {
  const [title] = gatherTitles(
    files.map((file) => aMediaSummary({ libraryId: FILMS.id, ...file })),
  );

  if (title === undefined) {
    throw new Error('no title');
  }

  return title;
};

const drawn = (title: MediaTitle, change: Partial<Parameters<typeof MediaTitlePage>[0]> = {}) => {
  const fix = vi.fn();
  const artwork = vi.fn();
  const onBack = vi.fn();

  render(
    <MediaTitlePage
      title={title}
      library={FILMS}
      actionsFor={() => [
        [
          { id: 'wrong-match', label: 'Wrong match', onChoose: fix },
          { id: 'artwork', label: 'Choose artwork', onChoose: artwork },
        ],
      ]}
      place={{ shown: 'Film (2020)', folder: '/media/films/Film (2020)' }}
      paths={{}}
      onBack={onBack}
      {...change}
    />,
  );

  return { fix, artwork, onBack };
};

describe('MediaTitlePage', () => {
  it('names the title, its library and its match', () => {
    drawn(titleOf({ id: 'film', title: 'Film', year: 2020, externalId: '603' }));

    expect(screen.getByText('2020').parentElement).toHaveTextContent('Film2020');
    expect(screen.getByText(/Films · Matched · TMDB 603/)).toBeInTheDocument();
  });

  it('says a title the catalogue never matched is unmatched', () => {
    drawn(titleOf({ id: 'film', externalId: null }));

    expect(screen.getByText('Unmatched')).toBeInTheDocument();
  });

  it('fixes the match and chooses artwork through the title’s own actions', async () => {
    const user = userEvent.setup();
    const { fix, artwork } = drawn(titleOf({ id: 'film' }));

    await user.click(screen.getByRole('button', { name: 'Fix match' }));
    await user.click(screen.getByRole('button', { name: /^More for /u }));
    await user.click(await screen.findByRole('menuitem', { name: 'Choose artwork' }));

    expect(fix).toHaveBeenCalled();
    expect(artwork).toHaveBeenCalled();
  });

  it('opens its folder in Files only where Files is offered', async () => {
    const user = userEvent.setup();
    const onOpenFolder = vi.fn();

    drawn(titleOf({ id: 'film' }), { onOpenFolder });
    await user.click(screen.getByRole('button', { name: /^More for /u }));
    await user.click(await screen.findByRole('menuitem', { name: 'Open folder' }));

    expect(onOpenFolder).toHaveBeenCalledWith('/media/films/Film (2020)');
  });

  it('offers no folder without Files', async () => {
    const user = userEvent.setup();

    drawn(titleOf({ id: 'film' }));
    await user.click(screen.getByRole('button', { name: /^More for /u }));

    expect(await screen.findByRole('menuitem', { name: 'Choose artwork' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Open folder' })).not.toBeInTheDocument();
  });

  it('unmatches a matched title, and offers it only where it is matched', async () => {
    const user = userEvent.setup();

    unmatch.mockResolvedValue({ kind: 'reached', count: 1, jobId: null });
    drawn(titleOf({ id: 'film', externalId: '603' }));
    await user.click(screen.getByRole('button', { name: /^More for /u }));
    await user.click(await screen.findByRole('menuitem', { name: 'Unmatch' }));

    expect(unmatch).toHaveBeenCalledWith('film');
  });

  it('opens the refresh dialog', async () => {
    const user = userEvent.setup();

    drawn(titleOf({ id: 'film', title: 'Film', externalId: '603' }));
    await user.click(screen.getByRole('button', { name: 'Refresh' }));

    expect(await screen.findByRole('dialog', { name: 'Refresh Film' })).toBeInTheDocument();
  });

  it('lists every version of a film held more than once as a file of its own', async () => {
    const user = userEvent.setup();

    drawn(
      titleOf(
        { id: 'film', title: 'Film' },
        { id: 'cut', title: 'Film', parentId: 'film', versionLabel: 'Long cut' },
      ),
    );

    await user.click(screen.getByRole('tab', { name: 'Files' }));

    const files = screen.getByRole('table', { name: 'Files' });

    expect(within(files).getByText('Long cut')).toBeInTheDocument();
    expect(within(files).getAllByRole('row')).toHaveLength(3);
  });

  it('goes back to every title', async () => {
    const user = userEvent.setup();
    const { onBack } = drawn(titleOf({ id: 'film' }));

    await user.click(screen.getByRole('button', { name: 'Media' }));

    expect(onBack).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MediaTitlePage.displayName).toBe('MediaTitlePage');
  });
});
