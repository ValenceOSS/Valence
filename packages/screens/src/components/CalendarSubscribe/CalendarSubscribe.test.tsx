import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPlatform } from '@ValenceClient/platform/installPlatform';
import { aFakePlatform } from '@ValenceClient/testing/aFakePlatform';
import { renderInAnAddress } from '@ValenceScreens/testing/renderInAnAddress';
import { CalendarSubscribe } from './CalendarSubscribe';
import type { CalendarFeed } from '@ValenceContracts/schemas/CalendarFeed';

const fetchCalendarFeed = vi.fn<() => Promise<CalendarFeed | null>>();
const ensureCalendarFeed = vi.fn<() => Promise<CalendarFeed | null>>();

vi.mock('@ValenceClient/calendar/fetchCalendarFeed', () => ({
  fetchCalendarFeed: () => fetchCalendarFeed(),
}));

vi.mock('@ValenceClient/calendar/ensureCalendarFeed', () => ({
  ensureCalendarFeed: () => ensureCalendarFeed(),
}));

const renewCalendarFeed = vi.fn<() => Promise<CalendarFeed | null>>();
const stopCalendarFeed = vi.fn<() => Promise<boolean>>();

vi.mock('@ValenceClient/calendar/renewCalendarFeed', () => ({
  renewCalendarFeed: () => renewCalendarFeed(),
}));

vi.mock('@ValenceClient/calendar/stopCalendarFeed', () => ({
  stopCalendarFeed: () => stopCalendarFeed(),
}));

const FEED: CalendarFeed = {
  token: 'a-token',
  createdAt: '2026-10-02T10:00:00.000Z',
  lastReadAt: null,
};

const FEED_ADDRESS = `${window.location.origin}/api/calendar/feed/a-token.ics`;

beforeEach(() => {
  fetchCalendarFeed.mockReset().mockResolvedValue(FEED);
  ensureCalendarFeed.mockReset().mockResolvedValue(FEED);
  renewCalendarFeed.mockReset().mockResolvedValue({ ...FEED, token: 'b-token' });
  stopCalendarFeed.mockReset().mockResolvedValue(true);
});

/**
 * Opens the menu once the person's link has been read, as somebody would.
 *
 * @param user - Who is pressing.
 */
const openTheMenu = async (user: ReturnType<typeof userEvent.setup>) => {
  await waitFor(() => {
    expect(fetchCalendarFeed).toHaveBeenCalled();
  });
  await user.click(screen.getByRole('button', { name: 'Add to Calendar' }));
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('CalendarSubscribe', () => {
  it('opens the person’s link in Google Calendar, as a subscription', async () => {
    const user = userEvent.setup();
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);

    renderInAnAddress(<CalendarSubscribe />);
    await waitFor(() => {
      expect(fetchCalendarFeed).toHaveBeenCalled();
    });
    await user.click(screen.getByRole('button', { name: 'Add to Calendar' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Google Calendar' }));

    await waitFor(() => {
      expect(opened).toHaveBeenCalledWith(
        expect.stringContaining(
          `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(
            FEED_ADDRESS.replace(/^https?:/, 'webcal:'),
          )}`,
        ),
        '_blank',
        'noopener',
      );
    });
  });

  it('copies the link, saying so without closing', async () => {
    const user = userEvent.setup();
    const writeText = vi.fn(() => Promise.resolve());

    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    renderInAnAddress(<CalendarSubscribe />);
    await waitFor(() => {
      expect(fetchCalendarFeed).toHaveBeenCalled();
    });
    await user.click(screen.getByRole('button', { name: 'Add to Calendar' }));
    await user.click(await screen.findByRole('menuitem', { name: 'Copy link' }));

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(FEED_ADDRESS);
    });
    expect(await screen.findByRole('menuitem', { name: 'Copied' })).toBeInTheDocument();
  });

  it('makes the person a link as the menu opens, where they have none', async () => {
    const user = userEvent.setup();

    fetchCalendarFeed.mockResolvedValue(null);
    renderInAnAddress(<CalendarSubscribe />);
    await waitFor(() => {
      expect(fetchCalendarFeed).toHaveBeenCalled();
    });
    await user.click(screen.getByRole('button', { name: 'Add to Calendar' }));

    await waitFor(() => {
      expect(ensureCalendarFeed).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByRole('menuitem', { name: 'Copy link' })).not.toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });
  });

  it('keeps the ways to add the calendar waiting until there is a link to add', async () => {
    const user = userEvent.setup();

    fetchCalendarFeed.mockResolvedValue(null);
    ensureCalendarFeed.mockResolvedValue(null);
    renderInAnAddress(<CalendarSubscribe />);
    await openTheMenu(user);

    for (const name of ['Apple Calendar or Outlook', 'Google Calendar', 'Copy link']) {
      expect(await screen.findByRole('menuitem', { name })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    }
  });

  it('looks after the link once there is one: when it was last read, a new one, or none', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<CalendarSubscribe />);
    await openTheMenu(user);

    expect(await screen.findByText('Not read by a calendar app yet')).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: /Make a new link/ })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Turn off' })).toBeInTheDocument();
  });

  it('offers nothing to look after before there is a link', async () => {
    const user = userEvent.setup();

    fetchCalendarFeed.mockResolvedValue(null);
    ensureCalendarFeed.mockResolvedValue(null);
    renderInAnAddress(<CalendarSubscribe />);
    await openTheMenu(user);

    expect(await screen.findByRole('menuitem', { name: 'Copy link' })).toBeInTheDocument();
    expect(screen.queryByRole('menuitem', { name: 'Turn off' })).toBeNull();
  });

  it('asks before making a new link, then makes it', async () => {
    const user = userEvent.setup();

    renderInAnAddress(<CalendarSubscribe />);
    await openTheMenu(user);
    await user.click(await screen.findByRole('menuitem', { name: /Make a new link/ }));

    expect(await screen.findByText('Make a new calendar link?')).toBeInTheDocument();
    expect(renewCalendarFeed).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: 'Make a new link' }));

    await waitFor(() => {
      expect(renewCalendarFeed).toHaveBeenCalledTimes(1);
    });
  });

  it('asks before turning the link off, and says so when it could not be', async () => {
    const user = userEvent.setup();

    stopCalendarFeed.mockResolvedValue(false);
    renderInAnAddress(<CalendarSubscribe />);
    await openTheMenu(user);
    await user.click(await screen.findByRole('menuitem', { name: 'Turn off' }));

    expect(await screen.findByText('Turn off your calendar link?')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Turn off' }));

    expect(
      await screen.findByText('The calendar link could not be changed. Try again.'),
    ).toBeInTheDocument();
    expect(stopCalendarFeed).toHaveBeenCalledTimes(1);
  });

  it('hands the subscription to the system in the desktop app, rather than leaving the page', async () => {
    const user = userEvent.setup();
    const opened = vi.spyOn(window, 'open').mockReturnValue(null);

    installPlatform(aFakePlatform({ thisClientKind: () => 'desktop' }));
    renderInAnAddress(<CalendarSubscribe />);
    await openTheMenu(user);
    await user.click(await screen.findByRole('menuitem', { name: 'Apple Calendar or Outlook' }));

    await waitFor(() => {
      expect(opened).toHaveBeenCalledWith(
        FEED_ADDRESS.replace(/^https?:/, 'webcal:'),
        '_blank',
        'noopener',
      );
    });
  });
});
