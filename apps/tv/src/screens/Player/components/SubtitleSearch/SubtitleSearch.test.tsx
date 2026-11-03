import { render, userEvent, waitFor } from '@testing-library/react-native';
import { SubtitleSearch } from '@ValenceTv/screens/Player/components/SubtitleSearch/SubtitleSearch';
import type { FoundSubtitle, FoundSubtitles } from '@ValenceContracts/schemas/SubtitleFinding';
import type { SubtitleTrack } from '@ValenceClient/playback/fetchSubtitles';

const FOUND: FoundSubtitle = {
  source: 'subdl',
  id: '4',
  name: 'Arrival.2016.2160p.WEB',
  language: 'en',
  isExactMatch: false,
  isHearingImpaired: true,
  isMachineTranslated: false,
  frameRate: null,
  downloads: null,
  score: 61,
  reasons: ['sameSource'],
};

const FRESH: SubtitleTrack = {
  id: 'sidecar:en',
  language: 'en',
  label: 'English',
  format: 'srt',
  isForced: false,
  isHearingImpaired: true,
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
    { code: 'en', label: 'English' },
    { code: 'de', label: 'German' },
  ],
  language: 'en',
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

describe('SubtitleSearch', () => {
  it('lists what was found under the language looked in', async () => {
    const drawn = await render(<SubtitleSearch mediaId="m1" tracks={[]} onFound={jest.fn()} />);

    expect(drawn.getByText('Find subtitles')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Language, English' })).toBeTruthy();
    expect(
      drawn.getByRole('button', {
        name: 'Arrival.2016.2160p.WEB, 61% match · Same source · SDH · SubDL',
      }),
    ).toBeTruthy();
  });

  it('takes the one pressed and hands back the track to switch on', async () => {
    const onFound = jest.fn();

    mockSearch.take.mockResolvedValue({ kind: 'kept', tracks: [FRESH], fresh: FRESH });

    const drawn = await render(<SubtitleSearch mediaId="m1" tracks={[]} onFound={onFound} />);

    await userEvent.press(drawn.getByRole('button', { name: /^Arrival/ }));

    await waitFor(() => {
      expect(onFound).toHaveBeenCalledWith([FRESH], FRESH);
    });
  });

  it('takes nothing more while one is being taken', async () => {
    mockSearch.taking = 'subdl:4';

    const drawn = await render(<SubtitleSearch mediaId="m1" tracks={[]} onFound={jest.fn()} />);

    expect(drawn.getByRole('button', { name: 'Arrival.2016.2160p.WEB, In progress' })).toBeTruthy();
    await userEvent.press(drawn.getByRole('button', { name: /^Arrival/ }));
    expect(mockSearch.take).not.toHaveBeenCalled();
  });

  it('opens the languages, and looks in the one chosen', async () => {
    const drawn = await render(<SubtitleSearch mediaId="m1" tracks={[]} onFound={jest.fn()} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Language, English' }));
    await userEvent.press(drawn.getByRole('button', { name: 'German' }));

    expect(mockSearch.choose).toHaveBeenCalledWith('de');
    expect(drawn.getByText('Find subtitles')).toBeTruthy();
  });

  it('says why the last one could not be kept', async () => {
    mockSearch.problem = 'The site wouldn’t give it.';

    const drawn = await render(<SubtitleSearch mediaId="m1" tracks={[]} onFound={jest.fn()} />);

    expect(drawn.getByText('The site wouldn’t give it.')).toBeTruthy();
  });

  it('says where it is still looking, nothing is set up, or nothing was found', async () => {
    mockSearch.found = { data: undefined, isError: false, refetch: jest.fn() };

    const looking = await render(<SubtitleSearch mediaId="m1" tracks={[]} onFound={jest.fn()} />);

    expect(looking.getByText('Looking for subtitles')).toBeTruthy();
    await looking.unmount();

    mockSearch.found = {
      data: { subtitles: [], isSetUp: false },
      isError: false,
      refetch: jest.fn(),
    };

    const unset = await render(<SubtitleSearch mediaId="m1" tracks={[]} onFound={jest.fn()} />);

    expect(unset.getByText(/No subtitle site is set up yet/)).toBeTruthy();
    await unset.unmount();

    mockSearch.found = {
      data: { subtitles: [], isSetUp: true },
      isError: false,
      refetch: jest.fn(),
    };

    const empty = await render(<SubtitleSearch mediaId="m1" tracks={[]} onFound={jest.fn()} />);

    expect(empty.getByText('Nothing was found in that language.')).toBeTruthy();
  });

  it('offers to look again where the sites could not be reached', async () => {
    const refetch = jest.fn();

    mockSearch.found = { data: undefined, isError: true, refetch };

    const drawn = await render(<SubtitleSearch mediaId="m1" tracks={[]} onFound={jest.fn()} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Try again' }));
    expect(refetch).toHaveBeenCalled();
  });
});
