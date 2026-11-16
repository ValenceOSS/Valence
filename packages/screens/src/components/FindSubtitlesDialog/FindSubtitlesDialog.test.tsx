import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RequestFailed } from '@ValenceClient/query/RequestFailed';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { FindSubtitlesDialog } from './FindSubtitlesDialog';
import type {
  FetchedSubtitle,
  FoundSubtitle,
  FoundSubtitles,
  SubtitleChoice,
  SubtitleFinding,
} from '@ValenceContracts/schemas/SubtitleFinding';

const findSubtitles = vi.hoisted(() =>
  vi.fn<(mediaId: string, language: string) => Promise<FoundSubtitles>>(),
);

vi.mock('@ValenceClient/library/findSubtitles', () => ({
  findSubtitles: (mediaId: string, language: string) => findSubtitles(mediaId, language),
}));

const fetchFoundSubtitle = vi.hoisted(() =>
  vi.fn<
    (mediaId: string, choice: SubtitleChoice) => Promise<FetchedSubtitle | { problem: string }>
  >(),
);

vi.mock('@ValenceClient/library/fetchFoundSubtitle', () => ({
  fetchFoundSubtitle: (mediaId: string, choice: SubtitleChoice) =>
    fetchFoundSubtitle(mediaId, choice),
}));

vi.mock('@ValenceUI/notify', () => ({ notify: { worked: vi.fn(), failed: vi.fn() } }));

const READY: SubtitleFinding = {
  state: 'ready',
  sites: ['subdl'],
  languages: ['en'],
  server: null,
};

const readSubtitleFinding = vi.hoisted(() =>
  vi.fn<(mediaId: string) => Promise<SubtitleFinding>>(),
);

vi.mock('@ValenceClient/library/readSubtitleFinding', () => ({
  readSubtitleFinding: (mediaId: string) => readSubtitleFinding(mediaId),
}));

const MEDIA = { id: '00000000-0000-4000-8000-000000000001', name: 'A film' };

/**
 * A subtitle found on SubDL, with whatever the test changes.
 *
 * @param change - What differs from the plain one.
 * @returns The subtitle.
 */
const aSubtitle = (change: Partial<FoundSubtitle>): FoundSubtitle => ({
  source: 'subdl',
  id: 'one',
  name: 'A.Film.2020.1080p.WEB.H264-GROUP',
  language: 'en',
  isExactMatch: false,
  isHearingImpaired: false,
  isMachineTranslated: false,
  frameRate: null,
  downloads: null,
  score: 0,
  reasons: [],
  matches: [],
  misses: [],
  unknowns: [],
  ...change,
});

const FOUND: FoundSubtitles = {
  isSetUp: true,
  subtitles: [
    aSubtitle({
      id: 'best',
      score: 91,
      reasons: ['sameSource', 'sameResolution'],
      matches: ['source', 'resolution'],
      misses: ['releaseGroup', 'videoCodec', 'audioCodec'],
      unknowns: ['edition', 'streamingService', 'frameRate'],
    }),
    aSubtitle({
      id: 'drifts',
      name: 'A.Film.2020.WEBRip.x264-OTHER',
      score: 0,
      reasons: ['differentFrameRate'],
      matches: ['edition'],
      misses: ['frameRate'],
      isHearingImpaired: true,
      downloads: 1204,
    }),
  ],
};

beforeEach(() => {
  findSubtitles.mockReset();
  fetchFoundSubtitle.mockReset();
  readSubtitleFinding.mockReset();
  readSubtitleFinding.mockResolvedValue(READY);
});

describe('FindSubtitlesDialog', () => {
  it('says so when the sites have nothing in that language', async () => {
    findSubtitles.mockResolvedValue({ subtitles: [], isSetUp: true });

    renderInAnAddress(<FindSubtitlesDialog media={MEDIA} onClose={vi.fn()} />);

    expect(await screen.findByText(/Nothing was found in that language/)).toBeInTheDocument();
  });

  it('says why the sites could not be searched, rather than that they found nothing', async () => {
    findSubtitles.mockRejectedValue(
      new RequestFailed(
        '/api/media/x/subtitles/found',
        503,
        false,
        'OpenSubtitles didn’t accept Valence’s key. An administrator can check it in Settings.',
      ),
    );

    renderInAnAddress(<FindSubtitlesDialog media={MEDIA} onClose={vi.fn()} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'OpenSubtitles didn’t accept Valence’s key. An administrator can check it in Settings.',
    );
  });

  it('lists what was found best first, with the best already picked', async () => {
    findSubtitles.mockResolvedValue(FOUND);

    renderInAnAddress(<FindSubtitlesDialog media={MEDIA} onClose={vi.fn()} />);

    const best = await screen.findByRole('radio', { name: /H264-GROUP/ });

    expect(best).toHaveAttribute('aria-checked', 'true');
    expect(best).toHaveTextContent('Best match');
    expect(best).toHaveTextContent('Source');
    expect(best).toHaveTextContent('91% match');
    expect(screen.getByText('2 results')).toBeInTheDocument();
  });

  it('lists what a subtitle does not share with the file as well as what it does', async () => {
    findSubtitles.mockResolvedValue(FOUND);

    renderInAnAddress(<FindSubtitlesDialog media={MEDIA} onClose={vi.fn()} />);

    const best = await screen.findByRole('radio', { name: /H264-GROUP/ });

    expect(best).toHaveTextContent(
      'SourceEditionRelease groupFrame rateResolutionVideo codecAudio codecStreaming service',
    );
  });

  it('lists only what matched where the server does not say what it checked', async () => {
    findSubtitles.mockResolvedValue({
      isSetUp: true,
      subtitles: [aSubtitle({ id: 'old', score: 30, reasons: ['sameSource'] })],
    });

    renderInAnAddress(<FindSubtitlesDialog media={MEDIA} onClose={vi.fn()} />);

    const old = await screen.findByRole('radio', { name: /H264-GROUP/ });

    expect(old).toHaveTextContent('Same source');
    expect(old).not.toHaveTextContent('Same group');
  });

  it('warns about a subtitle that will drift, and says where it is from', async () => {
    findSubtitles.mockResolvedValue(FOUND);

    renderInAnAddress(<FindSubtitlesDialog media={MEDIA} onClose={vi.fn()} />);

    const drifts = await screen.findByRole('radio', { name: /OTHER/ });

    expect(drifts).toHaveTextContent('Different frame rate, will drift');
    expect(drifts).toHaveTextContent('SDHSubDL1,204 downloads');
    expect(drifts).toHaveTextContent('SubDL');
    expect(drifts).not.toHaveTextContent('Best match');
  });

  it('adds the one picked, then closes', async () => {
    const onClose = vi.fn();
    const onFetched = vi.fn();
    findSubtitles.mockResolvedValue(FOUND);
    fetchFoundSubtitle.mockResolvedValue({ name: 'English' });

    renderInAnAddress(
      <FindSubtitlesDialog media={MEDIA} onClose={onClose} onFetched={onFetched} />,
    );

    const actor = userEvent.setup();

    await actor.click(await screen.findByRole('radio', { name: /OTHER/ }));
    await actor.click(screen.getByRole('button', { name: 'Add subtitles' }));

    await waitFor(() => {
      expect(onClose).toHaveBeenCalled();
    });

    expect(fetchFoundSubtitle).toHaveBeenCalledWith(MEDIA.id, {
      source: 'subdl',
      id: 'drifts',
      language: 'en',
    });
    expect(onFetched).toHaveBeenCalled();
  });

  it('stays open and says why where the subtitle could not be added', async () => {
    const onClose = vi.fn();
    findSubtitles.mockResolvedValue(FOUND);
    fetchFoundSubtitle.mockResolvedValue({ problem: 'SubDL refused the download.' });

    renderInAnAddress(<FindSubtitlesDialog media={MEDIA} onClose={onClose} />);

    await screen.findByRole('radio', { name: /H264-GROUP/ });
    await userEvent.setup().click(screen.getByRole('button', { name: 'Add subtitles' }));

    expect(await screen.findByText('SubDL refused the download.')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('says which sites it searches, and on which server where the title is from a linked one', async () => {
    readSubtitleFinding.mockResolvedValue({
      ...READY,
      sites: ['opensubtitles', 'subdl'],
      server: 'Films',
    });
    findSubtitles.mockResolvedValue(FOUND);

    renderInAnAddress(<FindSubtitlesDialog media={MEDIA} onClose={vi.fn()} />);

    expect(
      await screen.findByText('Searches OpenSubtitles and SubDL on Films'),
    ).toBeInTheDocument();
  });

  it.each([
    ['notAllowed', 'Films doesn’t allow this server to search for subtitles.'],
    ['notSetUp', 'Films has no subtitle site set up.'],
    ['notSupported', 'Films needs an update before this server can search for subtitles there.'],
    ['unreachable', 'Couldn’t reach Films.'],
  ] as const)('says why it cannot search where the linked server says %s', async (state, said) => {
    readSubtitleFinding.mockResolvedValue({ state, sites: [], languages: [], server: 'Films' });

    renderInAnAddress(<FindSubtitlesDialog media={MEDIA} onClose={vi.fn()} />);

    expect(await screen.findByText(said)).toBeInTheDocument();
    expect(findSubtitles).not.toHaveBeenCalled();
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('offers first the languages the server that holds it offers first', async () => {
    readSubtitleFinding.mockResolvedValue({ ...READY, languages: ['fr'] });
    findSubtitles.mockResolvedValue({ subtitles: [], isSetUp: true });

    renderInAnAddress(<FindSubtitlesDialog media={MEDIA} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(findSubtitles).toHaveBeenCalledWith(MEDIA.id, 'fr');
    });
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FindSubtitlesDialog.displayName).toBe('FindSubtitlesDialog');
  });
});
