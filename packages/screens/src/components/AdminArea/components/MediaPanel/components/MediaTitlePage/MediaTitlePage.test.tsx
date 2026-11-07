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
import type * as LibraryQueriesModule from '@ValenceClient/query/libraryQueries';
import type { SeasonSourceState } from '@ValenceContracts/schemas/SeasonSource';

const { unmatch, listFolder, readShow, readSeasonSource } = vi.hoisted(() => ({
  unmatch: vi.fn(),
  listFolder: vi.fn(),
  readShow: vi.fn(),
  readSeasonSource: vi.fn((_mediaId: string): Promise<SeasonSourceState> =>
    Promise.resolve({ source: null, canChoose: true }),
  ),
}));

vi.mock('@ValenceClient/admin/unmatchTitle', () => ({ unmatchTitle: unmatch }));
vi.mock('@ValenceClient/admin/fetchLibraryFolder', () => ({ fetchLibraryFolder: listFolder }));
vi.mock('@ValenceClient/admin/fetchSeasonSource', () => ({ fetchSeasonSource: readSeasonSource }));
vi.mock('@ValenceClient/query/libraryQueries', async (importOriginal) => {
  const actual = await importOriginal<typeof LibraryQueriesModule>();

  return {
    libraryQueries: {
      ...actual.libraryQueries,
      show: (libraryId: string | null, showId: string | null) => ({
        queryKey: ['show', libraryId, showId],
        queryFn: readShow,
        enabled: libraryId !== null && showId !== null,
      }),
    },
  };
});

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

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Film');
    expect(screen.getAllByText('Films')).not.toHaveLength(0);
    expect(screen.getAllByText('TMDB 603')).not.toHaveLength(0);
  });

  it('says a title the catalogue never matched is unmatched', () => {
    drawn(titleOf({ id: 'film', externalId: null }));

    expect(screen.getByText('Unmatched')).toBeInTheDocument();
  });

  it('fixes the match through the title’s own actions, and chooses artwork on its own tab', async () => {
    const user = userEvent.setup();
    const { fix } = drawn(titleOf({ id: 'film', externalId: '603' }));

    await user.click(screen.getByRole('button', { name: 'Fix match' }));

    expect(fix).toHaveBeenCalled();
    expect(screen.getByRole('tab', { name: 'Artwork' })).toBeInTheDocument();
  });

  it('offers no Artwork tab until the title is matched', () => {
    drawn(titleOf({ id: 'film' }));

    expect(screen.queryByRole('tab', { name: 'Artwork' })).not.toBeInTheDocument();
  });

  it('keeps a film’s file actions to its Files tab, and its title’s in the head', async () => {
    const user = userEvent.setup();

    render(
      <MediaTitlePage
        title={titleOf({ id: 'film', title: 'Film', externalId: '603' })}
        library={FILMS}
        actionsFor={() => [
          [
            { id: 'rebuild', label: 'Rebuild previews', onChoose: vi.fn() },
            { id: 'show-in-files', label: 'Show in Folders', onChoose: vi.fn() },
          ],
        ]}
        place={null}
        paths={{}}
        onBack={vi.fn()}
      />,
    );
    await user.click(screen.getByRole('button', { name: /^More for /u }));

    expect(await screen.findByRole('menuitem', { name: 'Show in Folders' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Rebuild previews' })).not.toBeInTheDocument();
  });

  it('offers no folder without Files', async () => {
    const user = userEvent.setup();

    drawn(titleOf({ id: 'film', externalId: '603' }));
    await user.click(screen.getByRole('button', { name: /^More for /u }));

    expect(await screen.findByRole('menuitem', { name: 'Unmatch' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Open folder' })).not.toBeInTheDocument();
  });

  it('unmatches a matched title once asked, and offers it only where it is matched', async () => {
    const user = userEvent.setup();

    unmatch.mockResolvedValue({ kind: 'reached', count: 1, jobId: null });
    drawn(titleOf({ id: 'film', externalId: '603' }));
    await user.click(screen.getByRole('button', { name: /^More for /u }));
    await user.click(await screen.findByRole('menuitem', { name: 'Unmatch' }));

    expect(unmatch).not.toHaveBeenCalled();

    await user.click(
      within(await screen.findByRole('dialog')).getByRole('button', { name: 'Unmatch' }),
    );

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
      { place: null },
    );

    await user.click(screen.getByRole('tab', { name: 'Files' }));

    const files = screen.getByRole('table', { name: 'Files' });

    expect(within(files).getByText('Long cut')).toBeInTheDocument();
    expect(within(files).getAllByRole('row')).toHaveLength(3);
  });

  it('manages the title’s own folder on its Files tab, its videos’ quality beside them', async () => {
    const user = userEvent.setup();
    const at = '/media/films/Film (2020)';
    const anEntry = (name: string, extra: object) => ({
      name,
      path: `${at}/${name}`,
      isFolder: false,
      sizeBytes: 1,
      modifiedAt: null,
      mediaId: null,
      ...extra,
    });

    listFolder.mockResolvedValue({
      path: at,
      parent: '/media/films',
      libraryId: FILMS.id,
      libraryPath: FILMS.path,
      isTruncated: false,
      entries: [
        anEntry('Film.mkv', { mediaId: 'film', titleId: 'film', status: 'inLibrary' }),
        anEntry('Film.en.srt', { status: 'sidecar', belongsTo: 'Film.mkv' }),
        anEntry('Other.mkv', { mediaId: 'other', titleId: 'other', status: 'inLibrary' }),
      ],
    });

    drawn(titleOf({ id: 'film', title: 'Film', videoCodec: 'hevc' }), {
      libraries: [FILMS],
      paths: { film: `${at}/Film.mkv` },
    });
    await user.click(screen.getByRole('tab', { name: 'Files' }));

    expect(await screen.findByText('Film.en.srt')).toBeInTheDocument();
    expect(screen.getByText('HEVC')).toBeInTheDocument();
    expect(screen.queryByText('Other.mkv')).not.toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Current folder' })).toHaveTextContent(
      'Film (2020)',
    );
  });

  it('goes back to every title', async () => {
    const user = userEvent.setup();
    const { onBack } = drawn(titleOf({ id: 'film' }));

    await user.click(screen.getByRole('button', { name: 'Media' }));

    expect(onBack).toHaveBeenCalled();
  });

  it('steps to the title before and after it, by button and by J and K', async () => {
    const user = userEvent.setup();
    const onPrevious = vi.fn();
    const onNext = vi.fn();

    drawn(titleOf({ id: 'film' }), { onPrevious, onNext });
    await user.click(screen.getByRole('button', { name: 'Previous' }));
    await user.keyboard('j');

    expect(onPrevious).toHaveBeenCalledTimes(1);
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('offers no stepping at the ends of the list', () => {
    drawn(titleOf({ id: 'film' }), { onNext: vi.fn() });

    expect(screen.getByRole('button', { name: 'Previous' })).toBeDisabled();
  });

  it('opens on the tab its address names, and says where it moved to', async () => {
    const user = userEvent.setup();
    const onTitlePlace = vi.fn();

    drawn(titleOf({ id: 'film' }), {
      titlePlace: { tab: 'files', season: null, episode: null, isSeasonPage: false },
      onTitlePlace,
    });

    expect(screen.getByRole('tab', { name: 'Files' })).toHaveAttribute('aria-selected', 'true');

    await user.click(screen.getByRole('tab', { name: 'History' }));

    expect(onTitlePlace).toHaveBeenCalledWith({
      tab: 'history',
      season: null,
      episode: null,
      isSeasonPage: false,
    });
  });

  it('keeps a film off the Seasons tab its address names', () => {
    drawn(titleOf({ id: 'film' }), {
      titlePlace: { tab: 'seasons', season: null, episode: null, isSeasonPage: false },
    });

    expect(screen.queryByRole('tab', { name: 'Seasons' })).not.toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true');
  });

  const EPISODES = [
    { id: 'e1', title: 'The First', episodeNumber: 1 },
    { id: 'e2', title: 'The Second', episodeNumber: 2 },
  ].map((one) =>
    aMediaSummary({
      ...one,
      seriesId: 'show-1',
      seriesTitle: 'A Show',
      seasonNumber: 1,
    }),
  );
  const aShow = () => {
    readShow.mockResolvedValue({ seasons: [{ seasonNumber: 1, episodes: EPISODES }] });

    return titleOf(...EPISODES);
  };

  it('opens an episode as a page of its own, with the way back up and on to the next', async () => {
    const onTitlePlace = vi.fn();
    const user = userEvent.setup();

    drawn(aShow(), {
      titlePlace: { tab: 'details', season: 1, episode: 'e1', isSeasonPage: false },
      onTitlePlace,
    });

    expect(await screen.findByRole('heading', { level: 1, name: /The First/u })).toHaveTextContent(
      'The FirstS01E01',
    );

    await user.click(screen.getByRole('button', { name: /^Next/u }));

    expect(onTitlePlace).toHaveBeenLastCalledWith({
      tab: 'details',
      season: 1,
      episode: 'e2',
      isSeasonPage: false,
    });

    await user.click(screen.getByRole('button', { name: 'Season 1' }));

    expect(onTitlePlace).toHaveBeenLastCalledWith({
      tab: 'details',
      season: 1,
      episode: null,
      isSeasonPage: true,
    });
  });

  it('opens a season as a page of its own, its episodes each opening theirs', async () => {
    const onTitlePlace = vi.fn();

    drawn(aShow(), {
      titlePlace: { tab: 'files', season: 1, episode: null, isSeasonPage: true },
      onTitlePlace,
    });

    expect(await screen.findByRole('heading', { level: 1, name: /Season 1/u })).toBeInTheDocument();

    await userEvent.setup().click(await screen.findByText('The Second'));

    expect(onTitlePlace).toHaveBeenLastCalledWith({
      tab: 'details',
      season: 1,
      episode: 'e2',
      isSeasonPage: false,
    });
  });

  it('says which other show a season’s episodes come from, and offers to fix the season’s match', async () => {
    readSeasonSource.mockResolvedValueOnce({
      source: { externalId: '900', externalSeason: 1, title: 'A Show', year: 2026 },
      canChoose: true,
    });

    const matched = EPISODES.map((one) => ({ ...one, externalId: '100' }));

    readShow.mockResolvedValue({ seasons: [{ seasonNumber: 1, episodes: matched }] });
    drawn(titleOf(...matched), {
      titlePlace: { tab: 'details', season: 1, episode: null, isSeasonPage: true },
    });

    expect((await screen.findAllByText('A Show (2026), season 1')).length).toBeGreaterThan(0);
    expect(screen.getAllByText('Episodes from').length).toBeGreaterThan(0);
    expect(readSeasonSource).toHaveBeenCalledWith('e1');
    expect(screen.getByRole('button', { name: 'Fix season match' })).toBeInTheDocument();
  });

  it('goes back from an episode to its programme’s seasons', async () => {
    const onTitlePlace = vi.fn();

    drawn(aShow(), {
      titlePlace: { tab: 'details', season: 1, episode: 'e2', isSeasonPage: false },
      onTitlePlace,
    });

    await userEvent.setup().click(await screen.findByRole('button', { name: 'A Show' }));

    expect(onTitlePlace).toHaveBeenLastCalledWith({
      tab: 'seasons',
      season: 1,
      episode: null,
      isSeasonPage: false,
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MediaTitlePage.displayName).toBe('MediaTitlePage');
  });
});
