import { render as renderBare, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import type { ReactElement } from 'react';
import { formatBytes } from '@ValenceCore/functions/formatBytes';
import { MediaPanel } from './MediaPanel';
import type { Library, MediaSummary } from '@ValenceContracts/schemas/Library';
import type { TitleRow } from '@ValenceContracts/schemas/TitleList';
import type { TitleListAsk } from '@ValenceClient/admin/TitleListAsk.types';
import type { MediaTitle } from './MediaTitle.types';
import { gatherTitles } from './gatherTitles';
import { filesOf } from './filesOf';
import { lengthOf } from './lengthOf';
import { folderOf } from '@ValenceCore/functions/folderOf';
import { titleFolderOf } from '@ValenceCore/functions/titleFolderOf';
import { sharpestStepOf } from '@ValenceCore/functions/sharpestStepOf';

/**
 * Draws the component under the cache the queries it makes need.
 *
 * @param ui - What to draw.
 * @returns What testing-library hands back.
 */
const render = (ui: ReactElement) => renderBare(ui, { wrapper: CacheScope });

const server = vi.hoisted(() => ({
  page: vi.fn(),
  keys: vi.fn(),
  problems: vi.fn(),
  choices: vi.fn(),
  files: vi.fn(),
}));

vi.mock('@ValenceClient/admin/fetchTitlePage', () => ({ fetchTitlePage: server.page }));
vi.mock('@ValenceClient/admin/fetchTitleKeys', () => ({ fetchTitleKeys: server.keys }));
vi.mock('@ValenceClient/admin/fetchLibraryProblems', () => ({
  fetchLibraryProblems: server.problems,
}));
vi.mock('@ValenceClient/admin/fetchTitleChoices', () => ({ fetchTitleChoices: server.choices }));
vi.mock('@ValenceClient/admin/fetchTitleFiles', () => ({ fetchTitleFiles: server.files }));

afterEach(() => {
  vi.unstubAllGlobals();
});

beforeEach(() => {
  served([]);
});

type Served = {
  paths?: Readonly<Record<string, string>>;
  duplicate?: readonly { id: string; path: string; group: string | null }[];
};

/**
 * The value every file of a title shares, or that they differ.
 *
 * @param values - One a file.
 * @returns The shared value, and whether they differ.
 */
const sharedBy = <Value,>(values: readonly Value[]) => {
  const [first] = values;
  const isMixed = values.some((value) => JSON.stringify(value) !== JSON.stringify(first));

  return { value: isMixed || first === undefined ? null : first, isMixed };
};

/**
 * A title as the server lists it, worked out here from its files.
 *
 * @param title - The title, gathered from its files.
 * @param served - Where each file is, and which are there twice.
 * @returns The row.
 */
const rowOf = (title: MediaTitle, served: Served): TitleRow => {
  const files = filesOf(title);
  const paths = served.paths ?? {};
  const step = sharedBy(files.map((file) => sharpestStepOf(file)?.label ?? ''));
  const range = sharedBy(files.map((file) => file.videoRange));
  const codec = sharedBy(files.map((file) => file.videoCodec));
  const audio = sharedBy(files.map((file) => file.audio ?? null));
  const held = files.map((file) => paths[file.id]).filter((path) => path !== undefined);
  const ids = new Set(files.map((file) => file.id));

  return {
    id: title.id,
    key: title.id,
    kind: title.kind === 'series' ? 'show' : 'film',
    libraryId: title.libraryId,
    lead: title.lead,
    name: title.name,
    order: title.order,
    year: title.year,
    files: files.length,
    versions: title.kind === 'film' ? Math.max(0, title.parts.length - 1) : 0,
    seasons: title.seasons,
    episodes: title.kind === 'series' ? title.episodes.length : 0,
    sizeBytes: title.sizeBytes,
    durationSeconds: lengthOf(title),
    latestAddedAt: title.addedAt,
    isMatched: title.isMatched,
    posterFrom: title.posterFrom,
    folder:
      title.kind === 'film'
        ? held[0] === undefined
          ? null
          : folderOf(held[0])
        : titleFolderOf(held),
    leadPath: paths[title.lead.id] ?? null,
    looks: {
      step: step.value === '' ? null : step.value,
      isStepMixed: step.isMixed,
      range: range.value,
      isRangeMixed: range.isMixed,
      codec: codec.value,
      isCodecMixed: codec.isMixed,
      audio: audio.value,
      isAudioMixed: audio.isMixed,
    },
    problemFiles: {
      duplicate: (served.duplicate ?? []).map((one) => ({ ...one, isOwn: ids.has(one.id) })),
      unreadable: [],
    },
    isEdited: false,
  };
};

/**
 * Answers the list's questions of the server from some files, as the server would: a library's
 * titles a page at a time, searched, quick-filtered and in order, a title's files, and how many in
 * each library need a look.
 *
 * @param media - Every file the libraries hold.
 * @param served - Where each file is, and which are there twice.
 */
const served = (media: readonly MediaSummary[], given: Served = {}) => {
  const titles = gatherTitles(media);
  const needsALook = (title: MediaTitle) =>
    !title.isMatched || (title.kind === 'film' && title.posterFrom === null);

  const listed = (asked: TitleListAsk) => {
    const words = asked.search.toLowerCase();
    const searched = titles.filter(
      (title) => title.libraryId === asked.libraryId && title.name.toLowerCase().includes(words),
    );
    const valueOf = (title: MediaTitle) =>
      asked.sort === 'size' ? String(title.sizeBytes ?? 0).padStart(15, '0') : title.order;
    const shown = searched
      .filter((title) => asked.show !== 'look' || needsALook(title))
      .sort(
        (left, right) =>
          valueOf(left).localeCompare(valueOf(right)) * (asked.isDescending ? -1 : 1),
      );

    return { searched, shown };
  };

  server.page.mockImplementation((asked: TitleListAsk) => {
    const { searched, shown } = listed(asked);

    return Promise.resolve({
      titles: shown.map((title) => rowOf(title, given)),
      next: null,
      total: shown.length,
      counts: {
        all: searched.length,
        look: searched.filter(needsALook).length,
        twice: 0,
        unreadable: 0,
        edited: 0,
      },
    });
  });
  server.keys.mockImplementation((asked: TitleListAsk) =>
    Promise.resolve({
      titles: listed(asked).shown.map((title) => ({
        id: title.id,
        leadId: title.lead.id,
        kind: title.kind === 'series' ? 'show' : 'film',
        name: title.name,
      })),
    }),
  );
  server.problems.mockImplementation(() => {
    const counts = new Map<string, number>();

    for (const title of titles.filter(needsALook)) {
      counts.set(title.libraryId, (counts.get(title.libraryId) ?? 0) + 1);
    }

    return Promise.resolve({
      libraries: [...counts].map(([libraryId, count]) => ({ libraryId, titles: count })),
    });
  });
  server.choices.mockImplementation(() => Promise.resolve({ filters: [] }));
  server.files.mockImplementation((id: string) => {
    const title = titles.find((one) => one.id === id || one.lead.id === id);

    return title === undefined
      ? Promise.reject(new Error('No such item'))
      : Promise.resolve({
          files: media.filter((file) =>
            title.kind === 'series'
              ? file.libraryId === title.libraryId &&
                (file.seriesId ?? file.seriesTitle) ===
                  (title.lead.seriesId ?? title.lead.seriesTitle)
              : file.id === title.lead.id || file.parentId === title.lead.id,
          ),
          paths: given.paths ?? {},
        });
  });
};

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
  keepsShowsTogether: true,
  higherProfileAsks: 'ask',
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

/**
 * Waits for the list to have read its first page.
 */
const loaded = async () => {
  await waitFor(() => {
    expect(screen.queryByLabelText('Reading the libraries')).not.toBeInTheDocument();
  });
};

const NOWHERE = { tab: 'details', season: null, episode: null, isSeasonPage: false };

describe('MediaPanel', () => {
  it('lists what the libraries hold', async () => {
    served([item()]);

    render(<MediaPanel {...props} />);

    await loaded();

    expect(screen.getByText('Parasite')).toBeInTheDocument();
  });

  it('switches to its folders, which the address keeps where it is asked to', async () => {
    const user = userEvent.setup();
    const onView = vi.fn();

    served([item()]);

    const { rerender } = render(<MediaPanel {...props} onView={onView} />);

    await loaded();

    await user.click(screen.getByRole('tab', { name: 'Folders' }));

    expect(onView).toHaveBeenCalledWith('folders');

    served([item()]);

    rerender(<MediaPanel {...props} view="folders" onView={onView} />);

    expect(screen.getByLabelText('Search files and folders')).toBeInTheDocument();
    expect(screen.queryByLabelText('Find a series or film')).not.toBeInTheDocument();
  });

  it('narrows to what was searched for', async () => {
    const user = userEvent.setup();

    served([item(), item({ id: 'item-2', title: 'Heat' })]);

    render(<MediaPanel {...props} />);

    await loaded();

    await user.type(screen.getByLabelText('Find a series or film'), 'heat');

    await waitFor(() => {
      expect(screen.queryByText('Parasite')).not.toBeInTheDocument();
    });
    expect(screen.getByText('Heat')).toBeInTheDocument();
  });

  it('says nothing matched, rather than looking like an empty library', async () => {
    const user = userEvent.setup();

    served([item()]);

    render(<MediaPanel {...props} />);

    await loaded();

    await user.type(screen.getByLabelText('Find a series or film'), 'zzz');

    expect(await screen.findByText(/Nothing matches your search/)).toBeInTheDocument();
  });

  it('asks for the item whose match is wrong', async () => {
    const onCorrect = vi.fn();
    const user = userEvent.setup();

    served([item()]);

    render(<MediaPanel {...props} onCorrect={onCorrect} />);

    await loaded();

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: /Wrong match/ }));

    expect(onCorrect).toHaveBeenCalledWith(item());
  });

  it('offers to choose the artwork of a matched title', async () => {
    const onChooseArtwork = vi.fn();
    const user = userEvent.setup();

    served([item()]);

    render(<MediaPanel {...props} onChooseArtwork={onChooseArtwork} />);

    await loaded();

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: /Choose artwork/ }));

    expect(onChooseArtwork).toHaveBeenCalledWith(
      expect.objectContaining({ mediaId: item().id, isSeries: false }),
    );
  });

  it('has no artwork to choose for a title the catalogue never matched', async () => {
    const user = userEvent.setup();

    served([item({ externalId: null })]);

    render(<MediaPanel {...props} onChooseArtwork={vi.fn()} />);

    await loaded();

    await user.click(screen.getByRole('button', { name: /Actions for/ }));

    expect(screen.queryByRole('menuitem', { name: /Choose artwork/ })).not.toBeInTheDocument();
  });

  it('asks for the item whose preview moment is to be chosen', async () => {
    const onChooseMoment = vi.fn();
    const user = userEvent.setup();

    served([item()]);

    render(<MediaPanel {...props} onChooseMoment={onChooseMoment} />);

    await loaded();

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: 'Choose the preview frame' }));

    expect(onChooseMoment).toHaveBeenCalledWith(item());
  });

  it('is in order by name, and can be turned the other way', async () => {
    const user = userEvent.setup();

    served([item({ id: 'z', title: 'Zodiac' }), item({ id: 'a', title: 'Alien' })]);

    render(<MediaPanel {...props} />);

    await loaded();

    expect(screen.getAllByRole('row')[1]?.textContent).toContain('Alien');

    await user.click(screen.getByRole('button', { name: /Title/ }));

    await waitFor(() => {
      expect(screen.getAllByRole('row')[1]?.textContent).toContain('Zodiac');
    });
  });

  it('offers to rebuild one item, for the case where a single preview is wrong', async () => {
    const onRebuildArtefacts = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();

    served([item()]);

    render(<MediaPanel {...props} onRebuildArtefacts={onRebuildArtefacts} />);

    await loaded();

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: /Rebuild previews/ }));
    await user.click(await screen.findByRole('button', { name: 'Rebuild previews' }));

    expect(onRebuildArtefacts).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-1' }));
  });

  it('asks before throwing the previews away, and does nothing if told not to', async () => {
    const onRebuildArtefacts = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();

    served([item()]);

    render(<MediaPanel {...props} onRebuildArtefacts={onRebuildArtefacts} />);

    await loaded();

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

    served([item()]);

    render(<MediaPanel {...props} />);

    await loaded();

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: /Rebuild previews/ }));
    await user.click(await screen.findByRole('button', { name: 'Rebuild previews' }));
    await user.click(screen.getByRole('button', { name: /Actions for/ }));

    expect(await screen.findByRole('menuitem', { name: /Will rebuild/ })).toBeInTheDocument();
  });

  it('leaves the offer standing when the server would not do it', async () => {
    const user = userEvent.setup();

    served([item()]);

    render(
      <MediaPanel
        {...props}

        onRebuildArtefacts={vi.fn().mockResolvedValue(false)}
      />,
    );

    await loaded();

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: /Rebuild previews/ }));
    await user.click(await screen.findByRole('button', { name: 'Rebuild previews' }));
    await user.click(screen.getByRole('button', { name: /Actions for/ }));

    expect(await screen.findByRole('menuitem', { name: /Rebuild previews/ })).toBeInTheDocument();
  });

  it('offers no delete to whoever may not delete media', async () => {
    const user = userEvent.setup();

    served([item()]);

    render(<MediaPanel {...props} />);

    await loaded();

    await user.click(screen.getByRole('button', { name: /Actions for/ }));

    expect(screen.queryByRole('menuitem', { name: /Delete file/ })).not.toBeInTheDocument();
  });

  it('keeps asking where the file could not be deleted, so it can be tried again', async () => {
    const onDelete = vi.fn().mockResolvedValue(false);
    const user = userEvent.setup();

    served([item()]);

    render(<MediaPanel {...props} onDelete={onDelete} />);

    await loaded();

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

    served([item(), episode('e1', 1, 1, 'Pilot')]);

    render(<MediaPanel {...props} />);

    await loaded();

    expect(screen.getByText('Parasite')).toBeInTheDocument();
    expect(screen.queryByText('From')).not.toBeInTheDocument();

    await chooseFrom(user, 'Which library', 'Shows');

    expect(await screen.findByText('From')).toBeInTheDocument();
    expect(screen.queryByText('Parasite')).not.toBeInTheDocument();
  });

  it('says which libraries have titles to fix, so each need not be opened to find them', async () => {
    const user = userEvent.setup();

    served([item(), { ...episode('e1', 1, 1, 'Pilot'), externalId: null, hasPoster: false }]);

    render(<MediaPanel {...props} />);

    await loaded();

    await user.click(screen.getByRole('button', { name: 'Which library' }));

    expect(
      await screen.findByRole('menuitemradio', { name: 'Shows (1 to fix)' }),
    ).toBeInTheDocument();
  });

  it('lists a series once, sized by all its episodes rather than one', async () => {
    const user = userEvent.setup();

    served([episode('e1', 1, 1, 'Pilot'), episode('e2', 1, 2, 'Choose Wisely')]);

    render(<MediaPanel {...props} />);

    await loaded();

    await chooseFrom(user, 'Which library', 'Shows');

    const row = await screen.findByRole('row', { name: /From/ });

    expect(within(row).getByText('1 season · 2 episodes')).toBeInTheDocument();
    expect(within(row).getByText(formatBytes(2_000_000_000))).toBeInTheDocument();
    expect(within(row).queryByText('Pilot')).not.toBeInTheDocument();
  });

  it('opens a series onto its seasons, and a season onto its episodes, in the table’s own columns', async () => {
    const user = userEvent.setup();

    served([
      episode('e3', 2, 1, 'Return'),
      episode('e1', 1, 1, 'Pilot'),
      episode('e2', 1, 2, 'Choose Wisely'),
    ]);

    render(<MediaPanel {...props} />);

    await loaded();

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

    served([episode('e1', 1, 1, 'Pilot'), episode('e2', 1, 2, 'Choose Wisely')]);

    render(<MediaPanel {...props} />);

    await loaded();

    await chooseFrom(user, 'Which library', 'Shows');
    await user.click(await screen.findByRole('button', { name: 'Show the episodes of From' }));

    expect(screen.getByRole('row', { name: /Pilot/ })).toHaveAttribute('data-depth', '1');
    expect(screen.queryByText('Season 1')).not.toBeInTheDocument();
  });

  it('deletes one episode from its own menu without taking the series with it', async () => {
    const onDelete = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();

    served([episode('e1', 1, 1, 'Pilot'), episode('e2', 1, 2, 'Choose Wisely')]);

    render(
      <MediaPanel
        {...props}

        onDelete={onDelete}
      />,
    );

    await loaded();

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

    served([episode('e1', 1, 1, 'Pilot')]);

    render(<MediaPanel {...props} onDelete={onDelete} />);

    await loaded();

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

    served([{ ...episode('e1', 1, 1, 'Pilot'), seriesId: null }]);

    render(
      <MediaPanel
        {...props}

        onDelete={vi.fn().mockResolvedValue(true)}
      />,
    );

    await loaded();

    await chooseFrom(user, 'Which library', 'Shows');
    await user.click(await screen.findByRole('button', { name: 'Actions for From' }));

    expect(screen.queryByRole('menuitem', { name: /Delete series/ })).not.toBeInTheDocument();
  });

  it('re-encodes every episode of a series from the series’ own menu', async () => {
    const onReencode = vi.fn();
    const user = userEvent.setup();

    served([episode('e1', 1, 1, 'Pilot'), episode('e2', 1, 2, 'Choose Wisely')]);

    render(
      <MediaPanel
        {...props}

        onReencode={onReencode}
      />,
    );

    await loaded();

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

    served([item()]);

    render(<MediaPanel {...props} onShowCopies={onShowCopies} />);

    await loaded();

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: 'Saved copies' }));

    expect(onShowCopies).toHaveBeenCalledWith(
      expect.objectContaining({ id: item().id }),
      'Parasite',
    );
  });

  it('shows each title’s poster, and says where there is none', async () => {
    served([item(), item({ id: 'item-2', title: 'Heat', hasPoster: false })]);

    render(<MediaPanel {...props} />);

    await loaded();

    expect(screen.getByLabelText('No artwork')).toBeInTheDocument();
  });

  it('narrows to what is unmatched: no match, or no poster', async () => {
    const user = userEvent.setup();

    served([
      item(),
      item({ id: 'item-2', title: 'Heat', externalId: null }),
      item({ id: 'item-3', title: 'Alien', hasPoster: false }),
    ]);

    render(<MediaPanel {...props} />);

    await loaded();

    expect(screen.getByText('Unmatched')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Unmatched 2' }));

    expect(screen.queryByText('Parasite')).not.toBeInTheDocument();
    expect(screen.getByText('Heat')).toBeInTheDocument();
    expect(screen.getByText('Alien')).toBeInTheDocument();
  });

  it('says a matched title is listed for having no poster', async () => {
    served([item({ id: 'item-3', title: 'Alien', hasPoster: false })]);

    render(<MediaPanel {...props} />);

    await loaded();

    expect(screen.getByText('No poster')).toBeInTheDocument();
    expect(screen.queryByText('Unmatched')).not.toBeInTheDocument();
  });

  it('names the files a title shares its match with, under the title', async () => {
    served([item()], {
      duplicate: ['item-1', 'item-9'].map((id) => ({
        id,
        path: `/films/${id}.mkv`,
        group: 'film:tmdb-1',
      })),
    });

    render(<MediaPanel {...props} />);

    expect(await screen.findByText('Matched to the same film as item-9.mkv')).toBeInTheDocument();
    expect(screen.getByText('There twice')).toBeInTheDocument();
  });

  it('says what a film is at a glance: how long, how sharp and how it is encoded', async () => {
    served([item()]);

    render(<MediaPanel {...props} />);

    await loaded();

    const film = screen.getByRole('row', { name: /Parasite/ });

    expect(within(film).getByText('2:12:00')).toBeInTheDocument();
    expect(within(film).getByText('1080p')).toBeInTheDocument();
    expect(within(film).getByText('HEVC')).toBeInTheDocument();
  });

  it('tells an empty library apart from one it could not read, and from having none', async () => {
    const { rerender } = render(<MediaPanel {...props} />);

    await loaded();

    expect(screen.getByText(/Nothing has been scanned into this library yet/)).toBeInTheDocument();

    rerender(<MediaPanel {...props} isUnreachable />);

    expect(screen.getByText(/Couldn’t load the libraries from the server/)).toBeInTheDocument();

    rerender(<MediaPanel {...props} libraries={[]} />);

    expect(screen.getByText(/no libraries yet/)).toBeInTheDocument();
  });

  it('shows where a film’s file is, and opens its folder in Media’s folders', async () => {
    const onOpenFolder = vi.fn();
    const user = userEvent.setup();

    served([item()], { paths: { 'item-1': '/media/films/Parasite (2019)/Parasite.mkv' } });

    render(
      <MediaPanel
        {...props}

        paths={{ 'item-1': '/media/films/Parasite (2019)/Parasite.mkv' }}
        onOpenFolder={onOpenFolder}
      />,
    );

    await loaded();

    expect(screen.getByTitle('Parasite (2019)/Parasite.mkv')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Actions for Parasite' }));
    await user.click(screen.getByRole('menuitem', { name: 'Show in Folders' }));

    expect(onOpenFolder).toHaveBeenCalledWith('/media/films/Parasite (2019)');
  });

  it('offers to leave a film’s file out of the library, and asks first', async () => {
    const user = userEvent.setup();

    served([item()], { paths: { 'item-1': '/media/films/Parasite (2019)/Parasite.mkv' } });

    render(
      <MediaPanel
        {...props}

        paths={{ 'item-1': '/media/films/Parasite (2019)/Parasite.mkv' }}
      />,
    );

    await loaded();

    await user.click(screen.getByRole('button', { name: /Actions for/ }));
    await user.click(screen.getByRole('menuitem', { name: 'Exclude from library' }));

    expect(await screen.findByText('Exclude Parasite?')).toBeInTheDocument();
    expect(screen.getByText('Parasite (2019)/Parasite.mkv')).toBeInTheDocument();
    expect(screen.getByText(/Scans will skip this file/)).toBeInTheDocument();
  });

  it('leaves a whole series out by its folder', async () => {
    const user = userEvent.setup();

    served([episode('e1', 1, 1, 'Pilot'), episode('e2', 2, 1, 'Return')], {
      paths: {
        e1: '/media/shows/From/Season 1/From S01E01.mkv',
        e2: '/media/shows/From/Season 2/From S02E01.mkv',
      },
    });

    render(
      <MediaPanel
        {...props}

        paths={{
          e1: '/media/shows/From/Season 1/From S01E01.mkv',
          e2: '/media/shows/From/Season 2/From S02E01.mkv',
        }}
      />,
    );

    await loaded();

    await chooseFrom(user, 'Which library', 'Shows');
    await user.click(await screen.findByRole('button', { name: 'Actions for From' }));
    await user.click(screen.getByRole('menuitem', { name: 'Exclude from library' }));

    expect(await screen.findByText('Exclude From?')).toBeInTheDocument();
    expect(screen.getByText(/this folder and everything in it/)).toBeInTheDocument();
  });

  it('offers no way to leave out a file whose place on the disk is not known', async () => {
    const user = userEvent.setup();

    served([item()]);

    render(<MediaPanel {...props} />);

    await loaded();

    await user.click(screen.getByRole('button', { name: /Actions for/ }));

    expect(screen.queryByRole('menuitem', { name: 'Exclude from library' })).toBeNull();
  });

  it('shows a series’ own folder, and each episode’s folder from its row', async () => {
    const onOpenFolder = vi.fn();
    const user = userEvent.setup();

    served([episode('e1', 1, 1, 'Pilot'), episode('e2', 2, 1, 'Return')], {
      paths: {
        e1: '/media/shows/From/Season 1/From S01E01.mkv',
        e2: '/media/shows/From/Season 2/From S02E01.mkv',
      },
    });

    render(
      <MediaPanel
        {...props}

        paths={{
          e1: '/media/shows/From/Season 1/From S01E01.mkv',
          e2: '/media/shows/From/Season 2/From S02E01.mkv',
        }}
        onOpenFolder={onOpenFolder}
      />,
    );

    await loaded();

    await chooseFrom(user, 'Which library', 'Shows');

    expect(await screen.findByTitle('From')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show the episodes of From' }));
    await user.click(screen.getByRole('button', { name: 'Show the episodes in Season 2' }));
    await user.click(screen.getByRole('button', { name: 'Actions for Return' }));
    await user.click(screen.getByRole('menuitem', { name: 'Show in Folders' }));

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

    await loaded();

    await chooseFrom(user, 'Which library', 'Music');

    expect(await screen.findByText('Blue')).toBeInTheDocument();
    expect(screen.getByText('Joni Mitchell · 10 tracks · 36:00')).toBeInTheDocument();

    expect(screen.getByRole('button', { name: 'No cover 1' })).toBeInTheDocument();

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

    await loaded();

    await chooseFrom(user, 'Which library', 'Books');

    expect(await screen.findByText('Dune')).toBeInTheDocument();
    expect(screen.getByText('Frank Herbert · 48 chapters')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Show /media/books in Folders' }));

    expect(onOpenFolder).toHaveBeenCalledWith('/media/books');
    expect(screen.getByText('Dune.epub')).toBeInTheDocument();
    expect(screen.getByText(formatBytes(5_000_000))).toBeInTheDocument();
  });

  it('opens a film onto each of its editions, each with its own file actions', async () => {
    const onDelete = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();

    served([
      item(),
      item({
        id: 'item-2',
        parentId: 'item-1',
        versionLabel: 'Extended Cut',
        width: 1280,
        height: 720,
        sizeBytes: 1_000_000_000,
      }),
    ]);

    render(
      <MediaPanel
        {...props}

        onDelete={onDelete}
      />,
    );

    await loaded();

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

    served([
      episode('e1', 1, 1, 'Pilot'),
      { ...episode('e1b', 1, 1, 'Pilot'), parentId: 'e1', versionLabel: 'Bluray-1080p' },
      episode('e2', 1, 2, 'Choose Wisely'),
    ]);

    render(<MediaPanel {...props} />);

    await loaded();

    await chooseFrom(user, 'Which library', 'Shows');
    await user.click(await screen.findByRole('button', { name: 'Show the episodes of From' }));

    expect(screen.getAllByRole('row', { name: /Pilot/ })).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Show the editions of Pilot' }));

    expect(screen.getByRole('row', { name: /Bluray-1080p/ })).toHaveAttribute('data-depth', '2');
  });

  it('says a library is still being read the first time, rather than that nothing is in it', () => {
    render(
      <MediaPanel
        {...props}
        stillReading={{ libraries: false, files: true, albums: false, books: false }}
      />,
    );

    expect(screen.getByLabelText('Reading the libraries')).toBeInTheDocument();
    expect(screen.queryByText(/Nothing has been scanned/)).not.toBeInTheDocument();
  });

  it('says the libraries are being read, rather than that there are none, before they arrive', () => {
    render(
      <MediaPanel
        {...props}
        libraries={[]}
        stillReading={{ libraries: true, files: true, albums: true, books: true }}
      />,
    );

    expect(screen.getByLabelText('Reading the libraries')).toBeInTheDocument();
    expect(screen.queryByText(/There are no libraries yet/)).not.toBeInTheDocument();
  });

  it('reads a music library by its albums, not by its files', () => {
    render(
      <MediaPanel
        {...props}
        libraries={[MUSIC]}
        stillReading={{ libraries: false, files: true, albums: false, books: false }}
      />,
    );

    expect(screen.queryByLabelText('Reading the libraries')).not.toBeInTheDocument();
  });

  it('says beside its heading when what it shows from last time is being checked', async () => {
    served([item()]);

    render(
      <MediaPanel
        {...props}

        freshness={{ isChecking: true, couldNotCheck: false }}
      />,
    );

    await loaded();

    expect(screen.getByText('Checking for changes')).toBeInTheDocument();
    expect(screen.getByText('Parasite')).toBeInTheDocument();
  });

  it('deletes every file of the titles selected, once asked', async () => {
    const onDelete = vi.fn().mockResolvedValue(true);
    const user = userEvent.setup();

    served([item(), item({ id: 'item-2', title: 'Heat' })]);

    render(
      <MediaPanel
        {...props}

        onDelete={onDelete}
      />,
    );

    await loaded();

    await user.click(screen.getByRole('checkbox', { name: 'Select every title shown' }));

    expect(screen.getByText('2 selected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'More' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));

    const asking = await screen.findByRole('dialog');

    expect(within(asking).getByText('Delete 2 files?')).toBeInTheDocument();

    await user.click(within(asking).getByRole('button', { name: 'Delete' }));

    expect(onDelete).toHaveBeenCalledTimes(2);
    expect(onDelete).toHaveBeenCalledWith(expect.objectContaining({ id: 'item-2' }), false);
  });

  it('selects one title at a time and clears the selection', async () => {
    const user = userEvent.setup();

    served([item(), item({ id: 'item-2', title: 'Heat' })]);

    render(<MediaPanel {...props} />);

    await loaded();

    await user.click(screen.getByRole('checkbox', { name: 'Select Heat' }));

    expect(screen.getByText('1 selected')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.queryByText('1 selected')).not.toBeInTheDocument();
  });

  it('opens a title on a page of its own, from its name or its menu', async () => {
    const onOpenTitle = vi.fn();
    const user = userEvent.setup();

    served([item()]);

    render(<MediaPanel {...props} onOpenTitle={onOpenTitle} />);

    await loaded();

    await user.click(screen.getByRole('button', { name: 'Parasite' }));
    await user.click(screen.getByRole('button', { name: 'Actions for Parasite' }));
    await user.click(screen.getByRole('menuitem', { name: 'Open' }));

    expect(onOpenTitle).toHaveBeenNthCalledWith(1, 'item-1', NOWHERE);
    expect(onOpenTitle).toHaveBeenNthCalledWith(2, 'item-1', NOWHERE);
  });

  it('opens a title from anywhere on its row, as its name does', async () => {
    const onOpenTitle = vi.fn();
    const user = userEvent.setup();

    served([item()]);

    render(<MediaPanel {...props} onOpenTitle={onOpenTitle} />);

    await loaded();

    await user.click(
      screen.getByText('Parasite').closest('tr')?.querySelector('td:last-child') ?? document.body,
    );

    expect(onOpenTitle).toHaveBeenCalledWith('item-1', NOWHERE);
  });

  it('draws the open title’s page, and goes back to every title', async () => {
    const onOpenTitle = vi.fn();
    const user = userEvent.setup();

    served([item()]);

    render(<MediaPanel {...props} openedTitle="item-1" onOpenTitle={onOpenTitle} />);

    await loaded();

    await user.click(screen.getByRole('button', { name: 'Media' }));

    expect(onOpenTitle).toHaveBeenCalledWith(null, NOWHERE);
  });

  it('asks before deleting a file from a title’s own page', async () => {
    const user = userEvent.setup();

    served([item()]);

    render(
      <MediaPanel
        {...props}

        openedTitle="item-1"
        onOpenTitle={vi.fn()}
        onDelete={vi.fn().mockResolvedValue(true)}
      />,
    );

    await loaded();

    await user.click(screen.getByRole('tab', { name: 'Files' }));
    await user.click(
      screen.getAllByRole('button', { name: 'Actions for Parasite' })[0] ?? document.body,
    );
    await user.click(await screen.findByRole('menuitem', { name: /Delete/ }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('forgets the titles chosen once the library, search or filter changes', async () => {
    const user = userEvent.setup();

    served([item(), item({ id: 'item-2', title: 'Heat' })]);

    render(<MediaPanel {...props} />);

    await loaded();

    await user.click(screen.getByRole('checkbox', { name: 'Select Heat' }));

    expect(screen.getByText('1 selected')).toBeInTheDocument();

    await user.type(screen.getByLabelText('Find a series or film'), 'Para');

    await waitFor(() => {
      expect(screen.queryByText('1 selected')).not.toBeInTheDocument();
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(MediaPanel.displayName).toBe('MediaPanel');
  });
});
