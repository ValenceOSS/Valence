import { render, renderHook, userEvent, within } from '@testing-library/react-native';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { aCalendarEntry } from '@ValenceClient/testing/aCalendarEntry';
import { useTheColours } from '@ValenceMobile/theme/useTheColours';
import { ACalendarMonth } from './ACalendarMonth';

const TODAY = '2026-10-02';

const PICKED = '2026-10-08';

const BUSY = '2026-10-15';

const ENTRIES = [
  aCalendarEntry({ id: 'a', date: PICKED }),
  aCalendarEntry({ id: 'b', date: PICKED }),
  ...['c', 'd', 'e', 'f', 'g'].map((id) => aCalendarEntry({ id, date: BUSY })),
];

const drawMonth = (onPick: (day: string) => void = jest.fn(), month?: string) =>
  render(
    <ACalendarMonth
      day={PICKED}
      {...(month === undefined ? {} : { month })}
      today={TODAY}
      entries={ENTRIES}
      onPick={onPick}
    />,
  );

const theDay = (drawn: Awaited<ReturnType<typeof drawMonth>>, date: string) =>
  drawn.getByRole('button', { name: nameTheDay(date, TODAY) });

const theNumberOf = (drawn: Awaited<ReturnType<typeof drawMonth>>, date: string) =>
  within(theDay(drawn, date)).getByText(Number(date.slice(8, 10)).toString());

const dotsOn = (drawn: Awaited<ReturnType<typeof drawMonth>>, date: string): number => {
  const dots = theNumberOf(drawn, date).parent?.children[1];

  return typeof dots === 'object' ? dots.children.length : 0;
};

describe('ACalendarMonth', () => {
  it('draws six whole weeks, Monday first, under the weekdays', async () => {
    const drawn = await drawMonth();

    expect(drawn.getAllByRole('button')).toHaveLength(42);
    expect(theDay(drawn, '2026-09-28')).toBeTruthy();
    expect(theDay(drawn, '2026-11-08')).toBeTruthy();
  });

  it('dots a day for each thing out on it, three at most', async () => {
    const drawn = await drawMonth();

    expect(dotsOn(drawn, PICKED)).toBe(2);
    expect(dotsOn(drawn, BUSY)).toBe(3);
    expect(dotsOn(drawn, '2026-10-09')).toBe(0);
  });

  it('marks the day picked as chosen and writes today in the accent', async () => {
    const { result } = await renderHook(() => useTheColours());
    const drawn = await drawMonth();

    expect(drawn.getByRole('button', { name: nameTheDay(PICKED, TODAY), selected: true })).toBe(
      theDay(drawn, PICKED),
    );
    expect(drawn.getAllByRole('button', { selected: true })).toHaveLength(1);
    expect(theNumberOf(drawn, TODAY)).toHaveStyle({ color: result.current.accent });
    expect(theNumberOf(drawn, PICKED)).toHaveStyle({ color: result.current.accentContrast });
  });

  it('shows another month where one is given, keeping the picked day', async () => {
    const drawn = await drawMonth(jest.fn(), '2026-12-20');

    expect(theDay(drawn, '2026-12-31')).toBeTruthy();
    expect(drawn.queryByRole('button', { name: nameTheDay(PICKED, TODAY) })).toBeNull();
  });

  it('says which day was pressed', async () => {
    const onPick = jest.fn();
    const drawn = await drawMonth(onPick);

    await userEvent.press(theDay(drawn, BUSY));

    expect(onPick).toHaveBeenCalledWith(BUSY);
  });
});
