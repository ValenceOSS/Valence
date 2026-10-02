import { render, userEvent } from '@testing-library/react-native';
import { nameTheDay } from '@ValenceClient/calendar/nameTheDay';
import { nameTheMonth } from '@ValenceClient/calendar/nameTheMonth';
import { ACalendarDaySheet } from './ACalendarDaySheet';

const TODAY = '2026-10-02';

const DAY = '2026-10-08';

const drawSheet = (
  told: { isOpen?: boolean; onPick?: (day: string) => void; onClose?: () => void } = {},
) =>
  render(
    <ACalendarDaySheet
      isOpen={told.isOpen ?? true}
      day={DAY}
      today={TODAY}
      onPick={told.onPick ?? jest.fn()}
      onClose={told.onClose ?? jest.fn()}
    />,
  );

describe('ACalendarDaySheet', () => {
  it('opens on the month the calendar is turned to', async () => {
    const drawn = await drawSheet();

    expect(drawn.getByText('Go to a day')).toBeTruthy();
    expect(drawn.getByText(nameTheMonth(DAY))).toBeTruthy();
    expect(
      drawn.getByRole('button', { name: nameTheDay(DAY, TODAY), selected: true }),
    ).toBeTruthy();
  });

  it('draws nothing while it is put away', async () => {
    const drawn = await drawSheet({ isOpen: false });

    expect(drawn.queryByText('Go to a day')).toBeNull();
  });

  it('turns a month at a time either way', async () => {
    const drawn = await drawSheet();

    await userEvent.press(drawn.getByRole('button', { name: 'Next' }));

    expect(drawn.getByText(nameTheMonth('2026-11-01'))).toBeTruthy();
    expect(drawn.getByRole('button', { name: nameTheDay('2026-11-30', TODAY) })).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Previous' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Previous' }));

    expect(drawn.getByText(nameTheMonth('2026-09-01'))).toBeTruthy();
    expect(drawn.getByRole('button', { name: nameTheDay('2026-09-01', TODAY) })).toBeTruthy();
  });

  it('says which day was picked, then puts itself away', async () => {
    const onPick = jest.fn();
    const onClose = jest.fn();
    const drawn = await drawSheet({ onPick, onClose });

    await userEvent.press(drawn.getByRole('button', { name: 'Next' }));
    await userEvent.press(drawn.getByRole('button', { name: nameTheDay('2026-11-20', TODAY) }));

    expect(onPick).toHaveBeenCalledWith('2026-11-20');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('goes straight back to today from any month', async () => {
    const onPick = jest.fn();
    const onClose = jest.fn();
    const drawn = await drawSheet({ onPick, onClose });

    await userEvent.press(drawn.getByRole('button', { name: 'Next' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Next' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Today' }));

    expect(onPick).toHaveBeenCalledWith(TODAY);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('opens again on the calendar’s month, wherever it was last turned to', async () => {
    const drawn = await drawSheet();

    await userEvent.press(drawn.getByRole('button', { name: 'Next' }));
    await drawn.rerender(
      <ACalendarDaySheet
        isOpen={false}
        day={DAY}
        today={TODAY}
        onPick={jest.fn()}
        onClose={jest.fn()}
      />,
    );
    await drawn.rerender(
      <ACalendarDaySheet isOpen day={DAY} today={TODAY} onPick={jest.fn()} onClose={jest.fn()} />,
    );

    expect(drawn.getByText(nameTheMonth(DAY))).toBeTruthy();
  });
});
