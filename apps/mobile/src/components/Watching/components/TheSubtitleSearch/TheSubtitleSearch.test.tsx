import { render, userEvent, waitFor } from '@testing-library/react-native';
import { TheSubtitleSearch } from './TheSubtitleSearch';
import type { FoundSubtitle, FoundSubtitles } from '@ValenceContracts/schemas/SubtitleFinding';
import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';

const FOUND: FoundSubtitle = {
  source: 'opensubtitles',
  id: '7',
  name: 'Arrival.2016.1080p.BluRay',
  language: 'fr',
  isExactMatch: true,
  isHearingImpaired: false,
  isMachineTranslated: false,
  frameRate: null,
  downloads: 3,
  score: 92,
  reasons: ['madeForThisFile'],
};

const FRESH: SubtitleTrack = {
  id: 'sidecar:fr',
  language: 'fr',
  label: 'French',
  format: 'srt',
  isForced: false,
  isHearingImpaired: false,
  delivery: 'text',
  streamIndex: null,
};

type AFakeSearch = {
  languages: { code: string; label: string }[];
  language: string;
  choose: jest.Mock;
  found: { data: FoundSubtitles | undefined; isError: boolean; refetch: jest.Mock };
  taking: string | null;
  problem: string | null;
  take: jest.Mock;
};

const mockSearch: AFakeSearch = {
  languages: [
    { code: 'fr', label: 'French' },
    { code: 'en', label: 'English' },
  ],
  language: 'fr',
  choose: jest.fn(),
  found: {
    data: { subtitles: [FOUND], isSetUp: true },
    isError: false,
    refetch: jest.fn(),
  },
  taking: null,
  problem: null,
  take: jest.fn(),
};

jest.mock('@ValenceClient/library/useSubtitleSearch', () => ({
  useSubtitleSearch: () => mockSearch,
}));

const drawIt = (onFound = jest.fn()) =>
  render(<TheSubtitleSearch mediaId="m1" tracks={[]} onFound={onFound} onClose={jest.fn()} />);

beforeEach(() => {
  mockSearch.found = {
    data: { subtitles: [FOUND], isSetUp: true },
    isError: false,
    refetch: jest.fn(),
  };
  mockSearch.taking = null;
  mockSearch.problem = null;
  mockSearch.take = jest.fn();
  mockSearch.choose = jest.fn();
});

describe('TheSubtitleSearch', () => {
  it('lists what was found, saying how well each fits the file', async () => {
    const drawn = await drawIt();

    expect(drawn.getByText('Arrival.2016.1080p.BluRay')).toBeTruthy();
    expect(drawn.getByText('92% match · Made for this file · OpenSubtitles')).toBeTruthy();
  });

  it('takes the one pressed and hands back the track to switch on', async () => {
    const onFound = jest.fn();

    mockSearch.take.mockResolvedValue({ kind: 'kept', tracks: [FRESH], fresh: FRESH });

    const drawn = await drawIt(onFound);

    await userEvent.press(drawn.getByRole('button', { name: /^Arrival\.2016\.1080p\.BluRay/ }));

    expect(mockSearch.take).toHaveBeenCalledWith(FOUND);
    await waitFor(() => {
      expect(onFound).toHaveBeenCalledWith([FRESH], FRESH);
    });
  });

  it('switches nothing on where the server would not keep it', async () => {
    const onFound = jest.fn();

    mockSearch.take.mockResolvedValue({ kind: 'refused', problem: 'No key is saved.' });

    const drawn = await drawIt(onFound);

    await userEvent.press(drawn.getByRole('button', { name: /^Arrival/ }));

    await waitFor(() => {
      expect(mockSearch.take).toHaveBeenCalled();
    });
    expect(onFound).not.toHaveBeenCalled();
  });

  it('says why the last one could not be kept', async () => {
    mockSearch.problem = 'No key is saved.';

    const drawn = await drawIt();

    expect(drawn.getByText('No key is saved.')).toBeTruthy();
  });

  it('changes the language looked in', async () => {
    const drawn = await drawIt();

    await userEvent.press(drawn.getByRole('button', { name: 'Language' }));
    await userEvent.press(drawn.getByRole('button', { name: 'English' }));

    expect(mockSearch.choose).toHaveBeenCalledWith('en');
    expect(drawn.getByText('Find subtitles')).toBeTruthy();
  });

  it('says it is still looking', async () => {
    mockSearch.found = { data: undefined, isError: false, refetch: jest.fn() };

    const drawn = await drawIt();

    expect(drawn.getByText('Looking for subtitles')).toBeTruthy();
  });

  it('says where no subtitle site is set up, or nothing was found', async () => {
    mockSearch.found = {
      data: { subtitles: [], isSetUp: false },
      isError: false,
      refetch: jest.fn(),
    };

    const unset = await drawIt();

    expect(unset.getByText(/No subtitle site is set up yet/)).toBeTruthy();
    await unset.unmount();

    mockSearch.found = {
      data: { subtitles: [], isSetUp: true },
      isError: false,
      refetch: jest.fn(),
    };

    const empty = await drawIt();

    expect(empty.getByText('Nothing was found in that language.')).toBeTruthy();
  });

  it('offers to look again where the sites could not be reached', async () => {
    const refetch = jest.fn();

    mockSearch.found = { data: undefined, isError: true, refetch };

    const drawn = await drawIt();

    expect(drawn.getByText('Couldn’t reach the subtitle sites.')).toBeTruthy();
    await userEvent.press(drawn.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalled();
  });
});
