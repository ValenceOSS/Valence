import { render } from '@testing-library/react-native';
import { NowAndNext } from '@ValenceTv/screens/LivePlayer/components/NowAndNext/NowAndNext';
import { aLiveChannel } from '@ValenceClient/testing/aLiveChannel';
import { aLiveProgramme } from '@ValenceClient/testing/aLiveProgramme';
import { liveClockTime } from '@ValenceClient/live/liveClockTime';

const NOW = Date.parse('2026-10-28T15:15:00.000Z');

const HALF_HOUR_MS = 30 * 60 * 1000;

const CHANNEL = aLiveChannel({ name: 'Film Four', number: '15' });

const ON_NOW = aLiveProgramme(CHANNEL.id, 'Arrival', NOW - HALF_HOUR_MS, NOW + HALF_HOUR_MS);

const UP_NEXT = aLiveProgramme(CHANNEL.id, 'Dune', NOW + HALF_HOUR_MS, NOW + 4 * HALF_HOUR_MS);

describe('NowAndNext', () => {
  it('names the channel, what is on with its times, and what follows', async () => {
    const drawn = await render(
      <NowAndNext channel={CHANNEL} onNow={ON_NOW} upNext={UP_NEXT} now={NOW} problem={null} />,
    );

    expect(drawn.getByText('15')).toBeOnTheScreen();
    expect(drawn.getByText('Film Four')).toBeOnTheScreen();
    expect(drawn.getByText('Arrival')).toBeOnTheScreen();
    expect(drawn.getByText(liveClockTime(ON_NOW.startsAt))).toBeOnTheScreen();
    expect(drawn.getByText(`Next at ${liveClockTime(UP_NEXT.startsAt)}: Dune`)).toBeOnTheScreen();
  });

  it('says the channel is live with no guide where the guide knows nothing', async () => {
    const drawn = await render(
      <NowAndNext channel={CHANNEL} onNow={null} upNext={null} now={NOW} problem={null} />,
    );

    expect(drawn.getByText('Live now · no guide')).toBeOnTheScreen();
  });

  it('says why the channel will not play in place of the programme', async () => {
    const drawn = await render(
      <NowAndNext
        channel={CHANNEL}
        onNow={ON_NOW}
        upNext={UP_NEXT}
        now={NOW}
        problem="That channel couldn’t be played."
      />,
    );

    expect(drawn.getByText('That channel couldn’t be played.')).toBeOnTheScreen();
    expect(drawn.queryByText('Arrival')).not.toBeOnTheScreen();
  });
});
