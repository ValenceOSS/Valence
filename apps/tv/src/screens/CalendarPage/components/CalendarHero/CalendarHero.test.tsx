import type { ReactElement } from 'react';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { CalendarHero } from '@ValenceTv/screens/CalendarPage/components/CalendarHero/CalendarHero';

jest.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () => new Promise(() => undefined),
}));

const TODAY = '2026-10-08';

const draw = (drawing: ReactElement) => render(drawing, { wrapper: CacheScope });

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('CalendarHero', () => {
  it('names the episode, the day it comes out and where it has got to', async () => {
    const drawn = await draw(
      <CalendarHero entry={aCalendarEntry({ artworkMediaId: null })} today={TODAY} />,
    );

    expect(drawn.getByText('A Show')).toBeTruthy();
    expect(drawn.getByText('S2 E5 · Fifth')).toBeTruthy();
    expect(drawn.getByText('Today   ·   Not out yet')).toBeTruthy();
  });

  it('names the page and says what it is handed where nothing is there yet', async () => {
    const drawn = await draw(
      <CalendarHero entry={null} today={TODAY}>
        <Text>Nothing yet</Text>
      </CalendarHero>,
    );

    expect(drawn.getByText('Calendar')).toBeTruthy();
    expect(drawn.getByText('Nothing yet')).toBeTruthy();
  });
});
