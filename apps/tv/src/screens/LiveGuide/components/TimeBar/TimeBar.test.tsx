import { render } from '@testing-library/react-native';
import { TimeBar } from '@ValenceTv/screens/LiveGuide/components/TimeBar/TimeBar';
import { liveClockTime } from '@ValenceClient/live/liveClockTime';

const FROM = Date.parse('2026-10-28T15:00:00.000Z');

const HALF_HOUR_MS = 30 * 60 * 1000;

const at = (time: number) => liveClockTime(new Date(time).toISOString());

describe('TimeBar', () => {
  it('marks each half hour of the stretch', async () => {
    const drawn = await render(
      <TimeBar from={FROM} until={FROM + 4 * HALF_HOUR_MS} width={1200} nowAt={null} />,
    );

    expect(drawn.getByText(at(FROM))).toBeOnTheScreen();
    expect(drawn.getByText(at(FROM + 3 * HALF_HOUR_MS))).toBeOnTheScreen();
    expect(drawn.queryByText(at(FROM + 4 * HALF_HOUR_MS))).not.toBeOnTheScreen();
  });

  it('starts at the next half hour where the stretch starts between them', async () => {
    const drawn = await render(
      <TimeBar from={FROM + 60_000} until={FROM + 2 * HALF_HOUR_MS} width={1200} nowAt={null} />,
    );

    expect(drawn.queryByText(at(FROM))).not.toBeOnTheScreen();
    expect(drawn.getByText(at(FROM + HALF_HOUR_MS))).toBeOnTheScreen();
  });
});
