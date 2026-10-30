import type { ReactElement } from 'react';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { CalendarDayShelf } from '@ValenceTv/screens/CalendarPage/components/CalendarDayShelf/CalendarDayShelf';

jest.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () => new Promise(() => undefined),
}));

const draw = (drawing: ReactElement) => render(drawing, { wrapper: CacheScope });

const ONE = aCalendarEntry({ id: 'one', title: 'One Show' });

const TWO = aCalendarEntry({ id: 'two', title: 'Two Show' });

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('CalendarDayShelf', () => {
  it('names the day and lays out what comes out on it in order', async () => {
    const drawn = await draw(
      <CalendarDayShelf
        day={{ date: ONE.date, entries: [ONE, TWO] }}
        name="Tomorrow"
        isFirst
        onFocus={jest.fn()}
        onOpen={jest.fn()}
      />,
    );

    expect(drawn.getByText('Tomorrow')).toBeTruthy();
    const cards = drawn.getAllByRole('button');

    expect(cards).toHaveLength(2);
    expect(cards[0]).toHaveAccessibleName(/^One Show/);
    expect(cards[1]).toHaveAccessibleName(/^Two Show/);
  });

  it('says which entry the remote rests on and which is chosen', async () => {
    const onFocus = jest.fn();
    const onOpen = jest.fn();
    const drawn = await draw(
      <CalendarDayShelf
        day={{ date: ONE.date, entries: [ONE, TWO] }}
        name="Tomorrow"
        isFirst={false}
        onFocus={onFocus}
        onOpen={onOpen}
      />,
    );

    await fireEvent(drawn.getByRole('button', { name: /^Two Show/ }), 'focus');
    await userEvent.press(drawn.getByRole('button', { name: /^Two Show/ }));

    expect(onFocus).toHaveBeenCalledWith(TWO);
    expect(onOpen).toHaveBeenCalledWith(TWO);
  });
});
