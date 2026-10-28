import { fireEvent, render } from '@testing-library/react-native';
import { GuideCell } from '@ValenceTv/screens/LiveGuide/components/GuideCell/GuideCell';
import { aLiveProgramme } from '@ValenceClient/testing/aLiveProgramme';
import { liveClockTime } from '@ValenceClient/live/liveClockTime';

const STARTS = Date.parse('2026-10-28T15:00:00.000Z');

const ENDS = Date.parse('2026-10-28T16:00:00.000Z');

const drawCell = (
  programme: ReturnType<typeof aLiveProgramme> | null,
  overrides: { width?: number; isOnNow?: boolean } = {},
) => {
  const told = { onWatch: jest.fn(), onKeep: jest.fn(), onFocus: jest.fn(), onBlur: jest.fn() };

  return {
    told,
    drawn: render(
      <GuideCell
        cell={{ startsAt: STARTS, endsAt: ENDS, programme }}
        channelName="Film Four"
        left={0}
        width={overrides.width ?? 400}
        isOnNow={overrides.isOnNow ?? false}
        cellRef={jest.fn()}
        {...told}
      />,
    ),
  };
};

describe('GuideCell', () => {
  it('shows the programme’s title and when it starts, and says both with the channel', async () => {
    const { drawn } = drawCell(aLiveProgramme('c', 'Arrival', STARTS, ENDS));
    const shown = await drawn;
    const time = liveClockTime(new Date(STARTS).toISOString());

    expect(shown.getByText('Arrival')).toBeOnTheScreen();
    expect(shown.getByText(time)).toBeOnTheScreen();
    expect(shown.getByRole('button', { name: `Film Four, ${time}: Arrival` })).toBeOnTheScreen();
  });

  it('watches the channel when chosen, and keeps it when held', async () => {
    const { drawn, told } = drawCell(aLiveProgramme('c', 'Arrival', STARTS, ENDS));
    const shown = await drawn;

    await fireEvent.press(shown.getByRole('button'));
    await fireEvent(shown.getByRole('button'), 'longPress');

    expect(told.onWatch).toHaveBeenCalledTimes(1);
    expect(told.onKeep).toHaveBeenCalledTimes(1);
  });

  it('says which cell the remote came to and left', async () => {
    const { drawn, told } = drawCell(aLiveProgramme('c', 'Arrival', STARTS, ENDS));
    const shown = await drawn;

    await fireEvent(shown.getByRole('button'), 'focus');
    await fireEvent(shown.getByRole('button'), 'blur');

    expect(told.onFocus).toHaveBeenCalledWith(expect.objectContaining({ startsAt: STARTS }));
    expect(told.onBlur).toHaveBeenCalledWith(expect.objectContaining({ startsAt: STARTS }));
  });

  it('says the channel is live with no guide where the gap is on now', async () => {
    const shown = await drawCell(null, { isOnNow: true }).drawn;

    expect(shown.getByText('Live now · no guide')).toBeOnTheScreen();
  });

  it('says there is no guide for a gap later on', async () => {
    const shown = await drawCell(null).drawn;

    expect(shown.getByText('No guide')).toBeOnTheScreen();
  });

  it('writes nothing in a cell too narrow for words, but still says what it is', async () => {
    const shown = await drawCell(aLiveProgramme('c', 'Arrival', STARTS, ENDS), { width: 40 }).drawn;

    expect(shown.queryByText('Arrival')).not.toBeOnTheScreen();
    expect(shown.getByRole('button', { name: /Arrival$/ })).toBeOnTheScreen();
  });
});
