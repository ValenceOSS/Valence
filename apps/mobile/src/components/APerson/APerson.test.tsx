import { render, userEvent } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aCatalogueTitle } from '@ValenceClient/testing/aCatalogueTitle';
import { fetchPerson, fetchPersonCredits } from '@ValenceClient/library/fetchPerson';
import { fetchWatchProgress } from '@ValenceClient/playback/watchProgress';
import { fetchPersonWork } from '@ValenceClient/requests/fetchAskable';
import { fetchRequestsAvailability } from '@ValenceClient/requests/fetchRequests';
import { fetchMyPermissions } from '@ValenceClient/session/fetchMyPermissions';
import { aTitle } from '@ValenceMobile/testing/aTitle';
import { holdAWindowOf } from '@ValenceMobile/testing/holdAWindowOf';
import { APerson } from './APerson';
import type { Person } from '@ValenceContracts/schemas/Person';
import type { APersonProps } from './APerson.types';

jest.mock('@ValenceClient/library/fetchPerson');
jest.mock('@ValenceClient/requests/fetchAskable');
jest.mock('@ValenceClient/session/fetchMyPermissions');
jest.mock('@ValenceClient/requests/fetchRequests', () => ({
  ...jest.requireActual<object>('@ValenceClient/requests/fetchRequests'),
  fetchRequestsAvailability: jest.fn(),
}));
jest.mock('@ValenceClient/playback/watchProgress', () => ({
  ...jest.requireActual<object>('@ValenceClient/playback/watchProgress'),
  fetchWatchProgress: jest.fn(),
}));

const AMY: Person = {
  id: 7,
  name: 'Amy Adams',
  portraitUrl: null,
  biography: 'An actor.',
  bornOn: null,
  bornIn: null,
};

const PORTRAIT = 'https://image.example/amy.jpg';

const OPENED_WIDE = 884;

const ASIDE_WIDE = OPENED_WIDE * 0.34;

/**
 * Draws the page about Amy Adams, with anything a test cares about changed.
 *
 * @param overrides - The props that differ.
 * @returns What was drawn.
 */
const drawAmy = (overrides: Partial<APersonProps> = {}) =>
  render(
    <APerson
      personId={7}
      onLookAt={jest.fn()}
      onLookAtShow={jest.fn()}
      onBack={jest.fn()}
      {...overrides}
    />,
    { wrapper: CacheScope },
  );

beforeEach(() => {
  holdAWindowOf(393, 852);
  jest.mocked(fetchPerson).mockReset().mockResolvedValue(AMY);
  jest
    .mocked(fetchPersonCredits)
    .mockReset()
    .mockResolvedValue({ films: [], shows: [], episodes: [] });
  jest.mocked(fetchPersonWork).mockReset().mockResolvedValue({ titles: [], timeline: [] });
  jest.mocked(fetchWatchProgress).mockReset().mockResolvedValue([]);
  jest
    .mocked(fetchRequestsAvailability)
    .mockReset()
    .mockResolvedValue({ isEnabled: true, kinds: ['film', 'series'] });
  jest
    .mocked(fetchMyPermissions)
    .mockReset()
    .mockResolvedValue({ permissions: ['requests.ask'], isAdministrator: false });
});

describe('APerson', () => {
  it('shows who somebody is and what they are in here, each opening', async () => {
    jest
      .mocked(fetchPersonCredits)
      .mockResolvedValue({ films: [aTitle()], shows: [], episodes: [] });
    const onLookAt = jest.fn();
    const drawn = await drawAmy({ onLookAt });

    expect(await drawn.findByText('Amy Adams')).toBeTruthy();

    await userEvent.press(await drawn.findByRole('button', { name: 'Arrival' }));

    expect(onLookAt).toHaveBeenCalledWith(aTitle().id);
  });

  it('lists what the catalogue says about them, and their biography', async () => {
    jest.mocked(fetchPerson).mockResolvedValue({
      ...AMY,
      bornIn: 'Vicenza, Italy',
      knownFor: 'Acting',
    });
    const drawn = await drawAmy();

    expect(await drawn.findByText('Personal info')).toBeTruthy();
    expect(drawn.getByText('Known for')).toBeTruthy();
    expect(drawn.getByText('Acting')).toBeTruthy();
    expect(drawn.getByText('Place of birth')).toBeTruthy();
    expect(drawn.getByText('Vicenza, Italy')).toBeTruthy();
    expect(drawn.getByText('Biography')).toBeTruthy();
    expect(drawn.getByText('An actor.')).toBeTruthy();
  });

  it('says where there is no biography', async () => {
    jest.mocked(fetchPerson).mockResolvedValue({ ...AMY, biography: null });
    const drawn = await drawAmy();

    expect(await drawn.findByText('No biography provided')).toBeTruthy();
    expect(drawn.queryByText('Personal info')).toBeNull();
  });

  it('shelves their films, programmes and episodes here, each under its own name', async () => {
    jest.mocked(fetchPersonCredits).mockResolvedValue({
      films: [aTitle()],
      shows: [aTitle({ id: '3fa85f64-5717-4562-b3fc-2c963f66af01', title: 'Severance' })],
      episodes: [
        aTitle({
          id: '3fa85f64-5717-4562-b3fc-2c963f66af02',
          title: 'Good News About Hell',
          seriesTitle: 'Severance',
          seasonNumber: 1,
          episodeNumber: 1,
        }),
      ],
    });
    const drawn = await drawAmy();

    expect(await drawn.findByText('Films')).toBeTruthy();
    expect(drawn.getByText('Programmes')).toBeTruthy();
    expect(drawn.getByText('Episodes')).toBeTruthy();
  });

  it('leaves out a shelf with nothing on it', async () => {
    jest
      .mocked(fetchPersonCredits)
      .mockResolvedValue({ films: [aTitle()], shows: [], episodes: [] });
    const drawn = await drawAmy();

    expect(await drawn.findByText('Films')).toBeTruthy();
    expect(drawn.queryByText('Programmes')).toBeNull();
    expect(drawn.queryByText('Episodes')).toBeNull();
  });

  it('offers the rest of their work to whoever may ask for it', async () => {
    jest
      .mocked(fetchPersonCredits)
      .mockResolvedValue({ films: [aTitle()], shows: [], episodes: [] });
    jest.mocked(fetchPersonWork).mockResolvedValue({
      titles: [
        aCatalogueTitle(),
        aCatalogueTitle({ kind: 'series', id: '95396', title: 'Severance' }),
        aCatalogueTitle({
          id: '329865',
          title: 'Arrival',
          standing: { status: 'library', mediaId: 'm-1', requestId: null, requestState: null },
        }),
      ],
      timeline: [],
    });
    const onAsk = jest.fn();
    const drawn = await drawAmy({ onAsk });

    expect(await drawn.findByText('More films')).toBeTruthy();
    expect(drawn.getByText('Programmes')).toBeTruthy();
    expect(drawn.getAllByRole('button', { name: 'Arrival' })).toHaveLength(1);

    await userEvent.press(drawn.getByRole('button', { name: 'Dune' }));

    expect(onAsk).toHaveBeenCalledWith('film', '438631');
  });

  it('names a shelf to ask from plainly where nothing of that kind is here', async () => {
    jest.mocked(fetchPersonWork).mockResolvedValue({ titles: [aCatalogueTitle()], timeline: [] });
    const drawn = await drawAmy({ onAsk: jest.fn() });

    expect(await drawn.findByRole('button', { name: 'Dune' })).toBeTruthy();
    expect(drawn.getByText('Films')).toBeTruthy();
    expect(drawn.queryByText('More films')).toBeNull();
  });

  it('offers only the kinds of title the server takes requests for', async () => {
    jest.mocked(fetchRequestsAvailability).mockResolvedValue({ isEnabled: true, kinds: ['film'] });
    jest.mocked(fetchPersonWork).mockResolvedValue({
      titles: [
        aCatalogueTitle(),
        aCatalogueTitle({ kind: 'series', id: '95396', title: 'Severance' }),
      ],
      timeline: [],
    });
    const drawn = await drawAmy({ onAsk: jest.fn() });

    expect(await drawn.findByRole('button', { name: 'Dune' })).toBeTruthy();
    expect(drawn.queryByText('Programmes')).toBeNull();
    expect(drawn.queryByRole('button', { name: 'Severance' })).toBeNull();
  });

  it('says where the rest of their work could not be read, and tries again', async () => {
    jest.mocked(fetchPersonWork).mockRejectedValue(new Error('down'));
    const drawn = await drawAmy({ onAsk: jest.fn() });

    expect(await drawn.findByText('Couldn’t load the rest of their work.')).toBeTruthy();
    expect(drawn.getByText('An actor.')).toBeTruthy();

    jest.mocked(fetchPersonWork).mockResolvedValue({ titles: [aCatalogueTitle()], timeline: [] });
    await userEvent.press(drawn.getByRole('button', { name: 'Try again' }));

    expect(await drawn.findByRole('button', { name: 'Dune' })).toBeTruthy();
  });

  it('says where nothing about them could be read, and tries again', async () => {
    jest.mocked(fetchPerson).mockRejectedValue(new Error('down'));
    const drawn = await drawAmy();

    expect(await drawn.findByText('Couldn’t load their details.')).toBeTruthy();

    jest.mocked(fetchPerson).mockResolvedValue(AMY);
    await userEvent.press(drawn.getByRole('button', { name: 'Try again' }));

    expect(await drawn.findByText('An actor.')).toBeTruthy();
  });

  it('shows every credit they have, each opening for whoever may ask', async () => {
    jest.mocked(fetchPersonWork).mockResolvedValue({
      titles: [],
      timeline: [{ ...aCatalogueTitle(), role: 'Lady Jessica', episodeCount: null }],
    });
    const onAsk = jest.fn();
    const drawn = await drawAmy({ onAsk });

    expect(await drawn.findByText('Timeline')).toBeTruthy();
    expect(drawn.getByText('as Lady Jessica')).toBeTruthy();
    expect(drawn.getByText('Known credits')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Dune' }));

    expect(onAsk).toHaveBeenCalledWith('film', '438631');
  });

  it('offers nothing to ask for to whoever may not ask', async () => {
    jest.mocked(fetchMyPermissions).mockResolvedValue({ permissions: [], isAdministrator: false });
    jest.mocked(fetchPersonWork).mockResolvedValue({
      titles: [aCatalogueTitle()],
      timeline: [{ ...aCatalogueTitle(), role: null, episodeCount: null }],
    });
    const drawn = await drawAmy({ onAsk: jest.fn() });

    expect(await drawn.findByText('An actor.')).toBeTruthy();
    expect(drawn.queryByText('Dune')).toBeNull();
    expect(drawn.queryByText('Timeline')).toBeNull();
    expect(fetchPersonWork).not.toHaveBeenCalled();
  });

  it('offers nothing to ask for where there is nowhere to ask', async () => {
    jest.mocked(fetchPersonWork).mockResolvedValue({ titles: [aCatalogueTitle()], timeline: [] });
    const drawn = await drawAmy();

    expect(await drawn.findByText('An actor.')).toBeTruthy();
    expect(drawn.queryByRole('button', { name: 'Dune' })).toBeNull();
    expect(fetchPersonWork).not.toHaveBeenCalled();
  });

  it('runs their portrait edge to edge on a phone', async () => {
    jest.mocked(fetchPerson).mockResolvedValue({ ...AMY, portraitUrl: PORTRAIT });
    const drawn = await drawAmy();

    expect(await drawn.findByLabelText('Amy Adams')).toHaveStyle({ width: 393 });
  });

  it('stands their portrait at the side, beside the rest, on the open inside of a folding phone', async () => {
    holdAWindowOf(OPENED_WIDE, 1104);
    jest
      .mocked(fetchPerson)
      .mockResolvedValue({ ...AMY, portraitUrl: PORTRAIT, knownFor: 'Acting' });
    const drawn = await drawAmy();

    expect(await drawn.findByLabelText('Amy Adams')).toHaveStyle({
      width: ASIDE_WIDE,
      height: (ASIDE_WIDE * 4) / 3,
    });
    expect(drawn.getByText('Acting')).toBeTruthy();
    expect(drawn.getByText('An actor.')).toBeTruthy();
  });

  it('keeps one column on the open inside where there is no portrait to stand beside', async () => {
    holdAWindowOf(OPENED_WIDE, 1104);
    const drawn = await drawAmy();

    expect(await drawn.findByText('Amy Adams')).toBeTruthy();
    expect(drawn.queryByLabelText('Amy Adams')).toBeNull();
    expect(drawn.getByText('An actor.')).toBeTruthy();
  });
});
