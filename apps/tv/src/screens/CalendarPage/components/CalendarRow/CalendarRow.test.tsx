import type { ReactElement } from 'react';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { CacheScope } from '@ValenceClient/testing/CacheScope';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { CalendarRow } from '@ValenceTv/screens/CalendarPage/components/CalendarRow/CalendarRow';
import { tokens } from '@ValenceTv/theme/tokens';

jest.mock('@ValenceClient/session/auth', () => ({
  fetchSession: () => new Promise(() => undefined),
}));

const draw = (drawing: ReactElement) => render(drawing, { wrapper: CacheScope });

beforeEach(() => {
  jest.spyOn(global, 'fetch').mockImplementation(() => new Promise(() => undefined));
});

afterEach(() => {
  jest.restoreAllMocks();
});

describe('CalendarRow', () => {
  it('names the episode and where it has got to', async () => {
    const drawn = await draw(
      <CalendarRow entry={aCalendarEntry()} hasPreferredFocus={false} onPress={jest.fn()} />,
    );

    expect(drawn.getByText('A Show')).toBeTruthy();
    expect(drawn.getByText('S2 E5 · Fifth')).toBeTruthy();
    expect(drawn.getByText('Not out yet')).toBeTruthy();
    expect(
      drawn.getByRole('button', { name: 'A Show   ·   S2 E5 · Fifth   ·   Not out yet' }),
    ).toBeTruthy();
  });

  it('says which release of a film it is, and who asked for it', async () => {
    const drawn = await draw(
      <CalendarRow
        entry={aCalendarEntry({
          title: 'Dune',
          episode: null,
          release: 'physical',
          state: 'wanted',
          source: 'request',
          requestedBy: { id: 'sam', name: 'Sam' },
        })}
        hasPreferredFocus={false}
        onPress={jest.fn()}
      />,
    );

    expect(drawn.getByText('On disc')).toBeTruthy();
    expect(drawn.getByText('Missing   ·   Sam')).toBeTruthy();
    expect(
      drawn.getByRole('button', { name: 'Dune   ·   On disc   ·   Missing   ·   Sam' }),
    ).toBeTruthy();
  });

  it('turns its words dark on the white it is lit with while focused', async () => {
    const drawn = await draw(
      <CalendarRow entry={aCalendarEntry()} hasPreferredFocus={false} onPress={jest.fn()} />,
    );

    expect(drawn.getByText('A Show')).toHaveStyle({ color: tokens.colours.text });

    await fireEvent(
      drawn.getByRole('button', { name: 'A Show   ·   S2 E5 · Fifth   ·   Not out yet' }),
      'focus',
    );

    expect(drawn.getByText('A Show')).toHaveStyle({ color: tokens.colours.onWhite });
  });

  it('hands over the entry when chosen', async () => {
    const onPress = jest.fn();
    const entry = aCalendarEntry();
    const drawn = await draw(<CalendarRow entry={entry} hasPreferredFocus onPress={onPress} />);

    await userEvent.press(
      drawn.getByRole('button', { name: 'A Show   ·   S2 E5 · Fifth   ·   Not out yet' }),
    );

    expect(onPress).toHaveBeenCalledWith(entry);
  });
});
