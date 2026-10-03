import { Alert, Linking, Share } from 'react-native';
import { render, userEvent, waitFor } from '@testing-library/react-native';
import { ensureCalendarFeed } from '@ValenceClient/calendar/ensureCalendarFeed';
import { fetchCalendarFeed } from '@ValenceClient/calendar/fetchCalendarFeed';
import { renewCalendarFeed } from '@ValenceClient/calendar/renewCalendarFeed';
import { stopCalendarFeed } from '@ValenceClient/calendar/stopCalendarFeed';
import { forgetPlatform, installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { ACalendarSubscribeSheet } from './ACalendarSubscribeSheet';
import type { CalendarFeed } from '@ValenceContracts/schemas/CalendarFeed';
import type { AlertButton } from 'react-native';

jest.mock('@ValenceClient/calendar/fetchCalendarFeed');
jest.mock('@ValenceClient/calendar/ensureCalendarFeed');
jest.mock('@ValenceClient/calendar/renewCalendarFeed');
jest.mock('@ValenceClient/calendar/stopCalendarFeed');

const FEED: CalendarFeed = {
  token: 'a-token',
  createdAt: '2026-10-02T10:00:00.000Z',
  lastReadAt: null,
};

const PAGE = 'http://one.local:8420/api/calendar/feed/a-token.ics';

const SUBSCRIPTION = 'webcal://one.local:8420/api/calendar/feed/a-token.ics';

let openURL: jest.SpiedFunction<typeof Linking.openURL>;
let share: jest.SpiedFunction<typeof Share.share>;
let alert: jest.SpiedFunction<typeof Alert.alert>;

const drawSheet = (onClose: () => void = jest.fn()) =>
  render(<ACalendarSubscribeSheet isOpen onClose={onClose} />, { wrapper: CacheScope });

/**
 * Presses the button an alert names, as somebody answering it would.
 *
 * @param text - What the button says.
 */
const answerTheAlert = (text: string) => {
  const buttons: AlertButton[] = alert.mock.calls.at(-1)?.[2] ?? [];

  buttons.find((button) => button.text === text)?.onPress?.();
};

beforeEach(() => {
  installPlatform(aFakePlatform({ serverAddress: () => 'http://one.local:8420' }));
  jest.mocked(fetchCalendarFeed).mockReset().mockResolvedValue(FEED);
  jest.mocked(ensureCalendarFeed).mockReset().mockResolvedValue(FEED);
  jest
    .mocked(renewCalendarFeed)
    .mockReset()
    .mockResolvedValue({ ...FEED, token: 'b-token' });
  jest.mocked(stopCalendarFeed).mockReset().mockResolvedValue(true);
  openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue();
  share = jest
    .spyOn(Share, 'share')
    .mockResolvedValue({ action: 'sharedAction', activityType: undefined });
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
});

afterEach(() => {
  forgetPlatform();
  jest.restoreAllMocks();
});

describe('ACalendarSubscribeSheet', () => {
  it('opens the person’s link in the phone’s calendar, then puts itself away', async () => {
    const onClose = jest.fn();
    const drawn = await drawSheet(onClose);

    await userEvent.press(await drawn.findByRole('button', { name: 'Apple Calendar or Outlook' }));

    expect(openURL).toHaveBeenCalledWith(SUBSCRIPTION);
    expect(onClose).toHaveBeenCalled();
  });

  it('opens the link in Google Calendar as a subscription', async () => {
    const drawn = await drawSheet();

    await userEvent.press(await drawn.findByRole('button', { name: 'Google Calendar' }));

    expect(openURL).toHaveBeenCalledWith(
      `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(SUBSCRIPTION)}`,
    );
  });

  it('hands the link to the share sheet, which can also copy it', async () => {
    const drawn = await drawSheet();

    await userEvent.press(await drawn.findByRole('button', { name: 'Share link' }));

    expect(share).toHaveBeenCalledWith({ url: PAGE, message: PAGE });
  });

  it('makes the person a link as it opens, where they have none', async () => {
    jest.mocked(fetchCalendarFeed).mockResolvedValue(null);

    await drawSheet();

    await waitFor(() => {
      expect(ensureCalendarFeed).toHaveBeenCalledTimes(1);
    });
  });

  it('says so where the link could not be made, and tries again when asked', async () => {
    jest.mocked(fetchCalendarFeed).mockResolvedValue(null);
    jest.mocked(ensureCalendarFeed).mockResolvedValueOnce(null).mockResolvedValueOnce(FEED);
    const drawn = await drawSheet();

    expect(await drawn.findByText('Couldn’t create the calendar link.')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Try again' }));

    expect(await drawn.findByRole('button', { name: 'Google Calendar' })).toBeTruthy();
    expect(ensureCalendarFeed).toHaveBeenCalledTimes(2);
  });

  it('says no calendar app has read the link yet', async () => {
    const drawn = await drawSheet();

    expect(await drawn.findByText('Not used by a calendar app yet')).toBeTruthy();
  });

  it('asks before making a new link, and makes it once asked', async () => {
    const drawn = await drawSheet();

    await userEvent.press(await drawn.findByRole('button', { name: 'Create new link' }));

    expect(alert).toHaveBeenCalledWith(
      'Create a new calendar link?',
      expect.any(String),
      expect.any(Array),
    );
    expect(renewCalendarFeed).not.toHaveBeenCalled();

    answerTheAlert('Create new link');

    await waitFor(() => {
      expect(renewCalendarFeed).toHaveBeenCalledTimes(1);
    });
  });

  it('puts itself away before asking to turn the link off', async () => {
    const onClose = jest.fn();
    const drawn = await drawSheet(onClose);

    await userEvent.press(await drawn.findByRole('button', { name: 'Turn off' }));

    expect(onClose).toHaveBeenCalled();
    answerTheAlert('Turn off');

    await waitFor(() => {
      expect(stopCalendarFeed).toHaveBeenCalledTimes(1);
    });
  });

  it('says so when the link could not be changed', async () => {
    jest.mocked(renewCalendarFeed).mockResolvedValue(null);
    const drawn = await drawSheet();

    await userEvent.press(await drawn.findByRole('button', { name: 'Create new link' }));
    answerTheAlert('Create new link');

    await waitFor(() => {
      expect(alert).toHaveBeenLastCalledWith('Couldn’t change the calendar link. Try again.');
    });
  });
});
