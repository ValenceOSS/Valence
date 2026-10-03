import { render as renderBare, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import type { ReactElement } from 'react';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { MediaPanel } from './MediaPanel';
import type { Library, MediaSummary } from '@ValenceContracts/schemas/Library';

/**
 * Draws the component under the cache the queries it makes need.
 *
 * @param ui - What to draw.
 * @returns What testing-library hands back.
 */
const render = (ui: ReactElement) => renderBare(ui, { wrapper: CacheScope });

const item = (overrides: Partial<MediaSummary> = {}): MediaSummary => ({
  id: 'item-1',
  libraryId: 'library-1',
  title: 'Parasite',
  year: 2019,
  durationSeconds: 7920,
  width: 1920,
  height: 1080,
  videoCodec: 'hevc',
  videoRange: 'SDR',
  addedAt: '2026-08-10T00:00:00.000Z',
  hasPoster: true,
  hasBackdrop: true,
  hasLogo: false,
  seriesId: null,
  seriesTitle: null,
  seasonNumber: null,
  episodeNumber: null,
  externalId: 'tmdb-1',
  sizeBytes: 4_000_000_000,
  ...overrides,
});

const library = (overrides: Partial<Library> = {}): Library => ({
  id: 'library-1',
  name: 'Films',
  kind: 'movies',
  path: '/media/films',
  itemCount: 1,
  lastScannedAt: null,
  defaultAudioLanguage: null,
  filesAtOnce: null,
  takesRequests: true,
  requestProfileId: null,
  requestPath: null,
  ...overrides,
});

const SHOWS = library({ id: 'library-2', name: 'Shows', kind: 'shows', path: '/media/shows' });

const MUSIC = library({ id: 'library-3', name: 'Music', kind: 'music', path: '/media/music' });

const BOOKS = library({ id: 'library-4', name: 'Books', kind: 'books', path: '/media/books' });

const episode = (id: string, season: number, number: number, title: string): MediaSummary =>
  item({
    id,
    libraryId: SHOWS.id,
    title,
    seriesId: 'series-from',
    seriesTitle: 'From',
    seasonNumber: season,
    episodeNumber: number,
    sizeBytes: 1_000_000_000,
  });

const props = {
  libraries: [library(), SHOWS],
  media: [],
  onCorrect: vi.fn(),
  onChooseMoment: vi.fn(),
  onRebuildArtefacts: vi.fn().mockResolvedValue(true),
};

/**
 * Opens one of the card's choices and takes the one named.
 *
 * @param user - Who is pressing.
 * @param menu - What the choice is for.
 * @param choice - Which to take.
 */
const chooseFrom = async (
  user: ReturnType<typeof userEvent.setup>,
  menu: string,
  choice: string,
) => {
  await user.click(screen.getByRole('button', { name: menu }));
  await user.click(await screen.findByRole('menuitemradio', { name: choice }));
};

describe('MediaPanel', () => {
  it('lists what the libraries hold', () => {
    render(<MediaPanel {...props} media={[item()]} />);

    expect(screen.getByText('Parasite')).toBeInTheDocument();
  });

  it('narrows to what was searched for', async () => {
    const user = userEvent.setup();

    render(<MediaPanel {...props} media={[item(), item({ id: 'item-2', title: 'Heat' })]} />);

    await user.type(screen.getByLabelText('Find a series or film'), 'heat');

    expect(screen.getByText('Heat')).toBeInTheDocument();
    expect(screen.queryByText('Parasite')).not.toBeInTheDocument();
  });

  it('says nothing matched, rather than looking like an empty library', async () => {
    const user = userEvent.setup();

    render(<MediaPanel {...props} media={[item()]} />);

    await user.type(screen.getByLabelText('Find a series or film'), 'zzz');

    expect(screen.getByText(/Nothing matches your search/)).toBeInTheDocument();
  });

  it('asks for the item whose match is wrong', async () => {
    const onCorrect = vi.fn();
    const user = userEvent.setup();

    render(<MediaPanel {...props} media={[item()]} onCorrect={onCorrect} />);

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: /Wrong match/ }));

    expect(onCorrect).toHaveBeenCalledWith(item());
  });

  it('offers to choose the artwork of a matched title', async () => {
    const onChooseArtwork = vi.fn();
    const user = userEvent.setup();

    render(<MediaPanel {...props} media={[item()]} onChooseArtwork={onChooseArtwork} />);

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: /Choose artwork/ }));

    expect(onChooseArtwork).toHaveBeenCalledWith(
      expect.objectContaining({ mediaId: item().id, isSeries: false }),
    );
  });

  it('has no artwork to choose for a title the catalogue never matched', async () => {
    const user = userEvent.setup();

    render(
      <MediaPanel {...props} media={[item({ externalId: null })]} onChooseArtwork={vi.fn()} />,
    );

    await user.click(screen.getByRole('button', { name: /Actions for/ }));

    expect(screen.queryByRole('menuitem', { name: /Choose artwork/ })).not.toBeInTheDocument();
  });

  it('asks for the item whose preview moment is to be chosen', async () => {
    const onChooseMoment = vi.fn();
    const user = userEvent.setup();

    render(<MediaPanel {...props} media={[item()]} onChooseMoment={onChooseMoment} />);

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: 'Choose the preview frame' }));

    expect(onChooseMoment).toHaveBeenCalledWith(item());
  });

  it('can be sorted by name, so a long list can be read down', async () => {
    const user = userEvent.setup();

    render(
      <MediaPanel
        {...props}
        media={[item({ id: 'z', title: 'Zodiac' }), item({ id: 'a', title: 'Alien' })]}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Title/ }));

    const [, first] = screen.getAllByRole('row');

    expect(first?.textContent).toContain('Alien');
  });

  it('offers to rebuild one item, for the case where a single preview is wrong', async () => {
    const onRebuildArtefacts = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();

    render(<MediaPanel {...props} media={[item()]} onRebuildArtefacts={onRebuildArtefacts} />);

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: /Rebuild previews/ }));
    await user.click(await screen.findByRole('button', { name: 'Rebuild previews' }));

    expect(onRebuildArtefacts).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-1' }));
  });

  it('asks before throwing the previews away, and does nothing if told not to', async () => {
    const onRebuildArtefacts = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();

    render(<MediaPanel {...props} media={[item()]} onRebuildArtefacts={onRebuildArtefacts} />);

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: /Rebuild previews/ }));

    expect(onRebuildArtefacts).not.toHaveBeenCalled();
    expect(await screen.findByRole('button', { name: 'Rebuild previews' })).toHaveClass(
      'bg-danger',
    );

    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onRebuildArtefacts).not.toHaveBeenCalled();
  });

  it('says it will rebuild rather than that it has, because nothing is made yet', async () => {
    const user = userEvent.setup();

    render(<MediaPanel {...props} media={[item()]} />);

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: /Rebuild previews/ }));
    await user.click(await screen.findByRole('button', { name: 'Rebuild previews' }));
    await user.click(screen.getByRole('button', { name: /Actions for/ }));

    expect(await screen.findByRole('menuitem', { name: /Will rebuild/ })).toBeInTheDocument();
  });

  it('leaves the offer standing when the server would not do it', async () => {
    const user = userEvent.setup();

    render(
      <MediaPanel
        {...props}
        media={[item()]}
        onRebuildArtefacts={vi.fn().mockResolvedValue(false)}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: /Rebuild previews/ }));
    await user.click(await screen.findByRole('button', { name: 'Rebuild previews' }));
    await user.click(screen.getByRole('button', { name: /Actions for/ }));

    expect(await screen.findByRole('menuitem', { name: /Rebuild previews/ })).toBeInTheDocument();
  });

  it('offers no delete to whoever may not delete media', async () => {
    const user = userEvent.setup();

    render(<MediaPanel {...props} media={[item()]} />);

    await user.click(screen.getByRole('button', { name: /Actions for/ }));

    expect(screen.queryByRole('menuitem', { name: /Delete file/ })).not.toBeInTheDocument();
  });

  it('keeps asking where the file could not be deleted, so it can be tried again', async () => {
    const onDelete = vi.fn().mockResolvedValue(false);
    const user = userEvent.setup();

    render(<MediaPanel {...props} media={[item()]} onDelete={onDelete} />);

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: /Delete file/ }));
    await user.click(await screen.findByRole('button', { name: 'Delete file' }));

    await vi.waitFor(
      () => {
        expect(onDelete).toHaveBeenCalledTimes(1);
      },
      { timeout: 5_000 },
    );
    expect(screen.getByText('Delete Parasite?')).toBeInTheDocument();
  });

  it('offers each library of films or series as its own choice', async () => {
    const user = userEvent.setup();

    render(<MediaPanel {...props} media={[item(), episode('e1', 1, 1, 'Pilot')]} />);

    expect(screen.getByText('Parasite')).toBeInTheDocument();
    expect(screen.queryByText('From')).not.toBeInTheDocument();

    await chooseFrom(user, 'Which library', 'Shows');

    expect(await screen.findByText('From')).toBeInTheDocument();
    expect(screen.queryByText('Parasite')).not.toBeInTheDocument();
  });

  it('lists a series once, sized by all its episodes rather than one', async () => {
    const user = userEvent.setup();

    render(
      <MediaPanel
        {...props}
        media={[episode('e1', 1, 1, 'Pilot'), episode('e2', 1, 2, 'Choose Wisely')]}
      />,
    );

    await chooseFrom(user, 'Which library', 'Shows');

    const row = await screen.findByRole('row', { name: /From/ });

    expect(within(row).getByText('1 season · 2 episodes')).toBeInTheDocument();
    expect(within(row).getByText(formatBytes(2_000_000_000))).toBeInTheDocument();
    expect(within(row).queryByText('Pilot')).not.toBeInTheDocument();
  });

  it('opens a series onto its seasons, and a season onto its episodes, in the table’s own columns', async () => {
    const user = userEvent.setup();

    render(
      <MediaPanel
        {...props}
        media={[
          episode('e3', 2, 1, 'Return'),
          episode('e1', 1, 1, 'Pilot'),
          episode('e2', 1, 2, 'Choose Wisely'),
        ]}
      />,
    );

    await chooseFrom(user, 'Which library', 'Shows');
    await user.click(await screen.findByRole('button', { name: 'Show the episodes of From' }));

    const seasonOne = screen.getByRole('row', { name: /Season 1/ });

    expect(seasonOne).toHaveAttribute('data-depth', '1');
    expect(within(seasonOne).getByText('2 episodes')).toBeInTheDocument();
    expect(within(seasonOne).getByText(formatBytes(2_000_000_000))).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Season 2/ })).toBeInTheDocument();
    expect(screen.queryByText('Pilot')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show the episodes in Season 1' }));

    const pilot = screen.getByRole('row', { name: /Pilot/ });

    expect(pilot).toHaveAttribute('data-depth', '2');
    expect(within(pilot).getByText('E1')).toBeInTheDocument();
    expect(within(pilot).getByText(formatBytes(1_000_000_000))).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Hide the episodes of From' }));

    await waitFor(() => {
      expect(screen.queryByText('Season 1')).not.toBeInTheDocument();
    });
  });

  it('opens a series of one season straight onto its episodes', async () => {
    const user = userEvent.setup();

    render(
      <MediaPanel
        {...props}
        media={[episode('e1', 1, 1, 'Pilot'), episode('e2', 1, 2, 'Choose Wisely')]}
      />,
    );

    await chooseFrom(user, 'Which library', 'Shows');
    await user.click(await screen.findByRole('button', { name: 'Show the episodes of From' }));

    expect(screen.getByRole('row', { name: /Pilot/ })).toHaveAttribute('data-depth', '1');
    expect(screen.queryByText('Season 1')).not.toBeInTheDocument();
  });

  it('deletes one episode from its own menu without taking the series with it', async () => {
    const onDelete = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();

    render(
      <MediaPanel
        {...props}
        media={[episode('e1', 1, 1, 'Pilot'), episode('e2', 1, 2, 'Choose Wisely')]}
        onDelete={onDelete}
      />,
    );

    await chooseFrom(user, 'Which library', 'Shows');
    await user.click(await screen.findByRole('button', { name: 'Show the episodes of From' }));
    await user.click(screen.getByRole('button', { name: 'Actions for Pilot' }));
    await user.click(screen.getByRole('menuitem', { name: /Delete file/ }));
    await user.click(await screen.findByRole('button', { name: 'Delete file' }));

    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }), false);
  });

  it('deletes a series only once it has been asked twice, as a whole', async () => {
    const onDelete = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();

    render(<MediaPanel {...props} media={[episode('e1', 1, 1, 'Pilot')]} onDelete={onDelete} />);

    await chooseFrom(user, 'Which library', 'Shows');
    await user.click(await screen.findByRole('button', { name: 'Actions for From' }));
    await user.click(screen.getByRole('menuitem', { name: /Delete series/ }));

    expect(await screen.findByText('Delete every episode of From?')).toBeInTheDocument();
    expect(onDelete).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Delete series' }));

    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'e1' }), true);
    await vi.waitFor(
      () => {
        expect(screen.queryByText('Delete every episode of From?')).not.toBeInTheDocument();
      },
      { timeout: 5_000 },
    );
  });

  it('offers no whole-series delete for episodes that belong to no series', async () => {
    const user = userEvent.setup();

    render(
      <MediaPanel
        {...props}
        media={[{ ...episode('e1', 1, 1, 'Pilot'), seriesId: null }]}
        onDelete={vi.fn().mockResolvedValue(true)}
      />,
    );

    await chooseFrom(user, 'Which library', 'Shows');
    await user.click(await screen.findByRole('button', { name: 'Actions for From' }));

    expect(screen.queryByRole('menuitem', { name: /Delete series/ })).not.toBeInTheDocument();
  });

  it('re-encodes every episode of a series from the series’ own menu', async () => {
    const onReencode = vi.fn();
    const user = userEvent.setup();

    render(
      <MediaPanel
        {...props}
        media={[episode('e1', 1, 1, 'Pilot'), episode('e2', 1, 2, 'Choose Wisely')]}
        onReencode={onReencode}
      />,
    );

    await chooseFrom(user, 'Which library', 'Shows');
    await user.click(await screen.findByRole('button', { name: 'Actions for From' }));
    await user.click(screen.getByRole('menuitem', { name: /Re-encode every episode/ }));

    expect(onReencode).toHaveBeenCalledWith([
      expect.objectContaining({ id: 'e1' }),
      expect.objectContaining({ id: 'e2' }),
    ]);
  });

  it('opens the copies kept of a film from its own menu', async () => {
    const onShowCopies = vi.fn();
    const user = userEvent.setup();

    render(<MediaPanel {...props} media={[item()]} onShowCopies={onShowCopies} />);

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: 'Saved copies' }));

    expect(onShowCopies).toHaveBeenCalledWith(
      expect.objectContaining({ id: item().id }),
      'Parasite',
    );
  });

  it('shows each title’s poster, and says where there is none', () => {
    render(
      <MediaPanel
        {...props}
        media={[item(), item({ id: 'item-2', title: 'Heat', hasPoster: false })]}
      />,
    );

    expect(screen.getByLabelText('No artwork')).toBeInTheDocument();
  });

  it('narrows to what is unmatched: no match, or no poster', async () => {
    const user = userEvent.setup();

    render(
      <MediaPanel
        {...props}
        media={[
          item(),
          item({ id: 'item-2', title: 'Heat', externalId: null }),
          item({ id: 'item-3', title: 'Alien', hasPoster: false }),
        ]}
      />,
    );

    expect(screen.getByText('Unmatched')).toBeInTheDocument();

    await chooseFrom(user, 'Which titles', 'Unmatched (2)');

    expect(screen.queryByText('Parasite')).not.toBeInTheDocument();
    expect(screen.getByText('Heat')).toBeInTheDocument();
    expect(screen.getByText('Alien')).toBeInTheDocument();
  });

  it('says what a film is at a glance: how long, how sharp and how it is encoded', () => {
    render(<MediaPanel {...props} media={[item()]} />);

    expect(screen.getByText('2:12:00 · 1080p · HEVC')).toBeInTheDocument();
  });

  it('tells an empty library apart from one it could not read, and from having none', () => {
    const { rerender } = render(<MediaPanel {...props} />);

    expect(screen.getByText(/Nothing has been scanned into this library yet/)).toBeInTheDocument();

    rerender(<MediaPanel {...props} isUnreachable />);

    expect(screen.getByText(/Couldn’t load the libraries from the server/)).toBeInTheDocument();

    rerender(<MediaPanel {...props} libraries={[]} />);

    expect(screen.getByText(/no libraries yet/)).toBeInTheDocument();
  });

  it('shows where a film’s file is, and opens its folder in Files', async () => {
    const onOpenFolder = vi.fn();
    const user = userEvent.setup();

    render(
      <MediaPanel
        {...props}
        media={[item()]}
        paths={{ 'item-1': '/media/films/Parasite (2019)/Parasite.mkv' }}
        onOpenFolder={onOpenFolder}
      />,
    );

    expect(screen.getByText('Parasite (2019)/Parasite.mkv')).toBeInTheDocument();

    await user.click(
      screen.getByRole('button', { name: 'Open /media/films/Parasite (2019) in Files' }),
    );

    expect(onOpenFolder).toHaveBeenCalledWith('/media/films/Parasite (2019)');
  });

  it('offers to leave a film’s file out of the library, and asks first', async () => {
    const user = userEvent.setup();

    render(
      <MediaPanel
        {...props}
        media={[item()]}
        paths={{ 'item-1': '/media/films/Parasite (2019)/Parasite.mkv' }}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: 'Exclude from library' }));

    expect(await screen.findByText('Exclude Parasite?')).toBeInTheDocument();
    expect(screen.getByText('Parasite (2019)/Parasite.mkv')).toBeInTheDocument();
    expect(screen.getByText(/Scans will skip this file/)).toBeInTheDocument();
  });

  it('leaves a whole series out by its folder', async () => {
    const user = userEvent.setup();

    render(
      <MediaPanel
        {...props}
        media={[episode('e1', 1, 1, 'Pilot'), episode('e2', 2, 1, 'Return')]}
        paths={{
          e1: '/media/shows/From/Season 1/From S01E01.mkv',
          e2: '/media/shows/From/Season 2/From S02E01.mkv',
        }}
      />,
    );

    await chooseFrom(user, 'Which library', 'Shows');
    await user.click(await screen.findByRole('button', { name: 'Actions for From' }));
    await user.click(screen.getByRole('menuitem', { name: 'Exclude from library' }));

    expect(await screen.findByText('Exclude From?')).toBeInTheDocument();
    expect(screen.getByText(/this folder and everything in it/)).toBeInTheDocument();
  });

  it('offers no way to leave out a file whose place on the disk is not known', async () => {
    const user = userEvent.setup();

    render(<MediaPanel {...props} media={[item()]} />);

    await user.click(screen.getByRole('button', { name: /Actions for/ }));

    expect(screen.queryByRole('menuitem', { name: 'Exclude from library' })).toBeNull();
  });

  it('shows a series’ own folder, and each episode’s folder from its row', async () => {
    const onOpenFolder = vi.fn();
    const user = userEvent.setup();

    render(
      <MediaPanel
        {...props}
        media={[episode('e1', 1, 1, 'Pilot'), episode('e2', 2, 1, 'Return')]}
        paths={{
          e1: '/media/shows/From/Season 1/From S01E01.mkv',
          e2: '/media/shows/From/Season 2/From S02E01.mkv',
        }}
        onOpenFolder={onOpenFolder}
      />,
    );

    await chooseFrom(user, 'Which library', 'Shows');

    expect(
      await screen.findByRole('button', { name: 'Open /media/shows/From in Files' }),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show the episodes of From' }));
    await user.click(screen.getByRole('button', { name: 'Show the episodes in Season 2' }));
    await user.click(screen.getByRole('button', { name: 'Actions for Return' }));
    await user.click(screen.getByRole('menuitem', { name: 'Show in Files' }));

    expect(onOpenFolder).toHaveBeenCalledWith('/media/shows/From/Season 2');
  });

  it('lists a music library’s albums with their covers, and corrects one', async () => {
    const onCorrectAlbum = vi.fn();
    const user = userEvent.setup();
    const blue = {
      id: '0f8fad5b-d9cb-469f-a165-70867728950e',
      libraryId: MUSIC.id,
      title: 'Blue',
      artist: { id: '7c9e6679-7425-40de-944b-e07fc1f90ae7', name: 'Joni Mitchell' },
      year: 1971,
      genres: [],
      hasArtwork: false,
      isCompilation: false,
      trackCount: 10,
      durationSeconds: 2160,
      sizeBytes: 0,
      isExplicit: false,
      addedAt: '2026-09-21T00:00:00.000Z',
    };

    render(
      <MediaPanel
        {...props}
        libraries={[library(), MUSIC]}
        albums={[blue]}
        onCorrectAlbum={onCorrectAlbum}
        paths={{ [blue.id]: '/media/music/Joni Mitchell/Blue/CD 1/01 All I Want.flac' }}
        onOpenFolder={vi.fn()}
      />,
    );

    await chooseFrom(user, 'Which library', 'Music');

    expect(await screen.findByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('Joni Mitchell · 10 tracks · 36:00')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Which titles' }));

    expect(await screen.findByRole('menuitemradio', { name: 'No cover (1)' })).toBeInTheDocument();

    await user.keyboard('{Escape}');

    await user.click(screen.getByRole('button', { name: 'Actions for Blue' }));
    await user.click(screen.getByRole('menuitem', { name: /Wrong match/ }));

    expect(onCorrectAlbum).toHaveBeenCalledWith(blue);
    expect(screen.getByText('Joni Mitchell/Blue')).toBeInTheDocument();
  });

  it('lists a book library’s books by title and author, with where each is', async () => {
    const onOpenFolder = vi.fn();
    const user = userEvent.setup();

    render(
      <MediaPanel
        {...props}
        libraries={[library(), BOOKS]}
        books={[
          {
            id: '0f8fad5b-d9cb-469f-a165-70867728950e',
            libraryId: BOOKS.id,
            title: 'Dune',
            layout: 'reflow',
            direction: 'leftToRight',
            year: 1965,
            overview: null,
            genres: null,
            authors: ['Frank Herbert'],
            rating: null,
            hasCover: true,
            chapterCount: 48,
            sizeBytes: 5_000_000,
            addedAt: '2026-09-21T00:00:00.000Z',
            updatedAt: '2026-09-21T00:00:00.000Z',
          },
        ]}
        paths={{ '0f8fad5b-d9cb-469f-a165-70867728950e': '/media/books/Dune.epub' }}
        onOpenFolder={onOpenFolder}
      />,
    );

    await chooseFrom(user, 'Which library', 'Books');

    expect(await screen.findByText('Dune')).toBeInTheDocument();
    expect(screen.getByText('Frank Herbert · 48 chapters')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Open /media/books in Files' }));

    expect(onOpenFolder).toHaveBeenCalledWith('/media/books');
    expect(screen.getByText('Dune.epub')).toBeInTheDocument();
    expect(screen.getByText(formatBytes(5_000_000))).toBeInTheDocument();
  });

  it('opens a film onto each of its editions, each with its own file actions', async () => {
    const onDelete = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();

    render(
      <MediaPanel
        {...props}
        media={[
          item(),
          item({
            id: 'item-2',
            parentId: 'item-1',
            versionLabel: 'Extended Cut',
            width: 1280,
            height: 720,
            sizeBytes: 1_000_000_000,
          }),
        ]}
        onDelete={onDelete}
      />,
    );

    expect(screen.getAllByText('Parasite')).toHaveLength(1);
    expect(screen.getByText('2 editions')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show the editions of Parasite' }));

    const cut = screen.getByRole('row', { name: /Extended Cut/ });

    expect(cut).toHaveAttribute('data-depth', '1');
    expect(within(cut).getByText(/720p/)).toBeInTheDocument();
    expect(screen.getByRole('row', { name: /Original/ })).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Actions for Extended Cut' }));
    await user.click(screen.getByRole('menuitem', { name: /Delete file/ }));
    await user.click(await screen.findByRole('button', { name: 'Delete file' }));

    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-2' }), false);
  });

  it('opens an episode onto its editions where it has more than one file', async () => {
    const user = userEvent.setup();

    render(
      <MediaPanel
        {...props}
        media={[
          episode('e1', 1, 1, 'Pilot'),
          { ...episode('e1b', 1, 1, 'Pilot'), parentId: 'e1', versionLabel: 'Bluray-1080p' },
          episode('e2', 1, 2, 'Choose Wisely'),
        ]}
      />,
    );

    await chooseFrom(user, 'Which library', 'Shows');
    await user.click(await screen.findByRole('button', { name: 'Show the episodes of From' }));

    expect(screen.getAllByRole('row', { name: /Pilot/ })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Show the editions of Pilot' }));

    expect(screen.getByRole('row', { name: /Bluray-1080p/ })).toHaveAttribute('data-depth', '2');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MediaPanel.displayName).toBe('MediaPanel');
  });
});
