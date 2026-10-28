import { render } from '@testing-library/react-native';
import { GuideRow } from '@ValenceTv/screens/LiveGuide/components/GuideRow/GuideRow';
import { aLiveChannel } from '@ValenceClient/testing/aLiveChannel';
import { aLiveProgramme } from '@ValenceClient/testing/aLiveProgramme';

const FROM = Date.parse('2026-10-28T15:00:00.000Z');

const HOUR_MS = 60 * 60 * 1000;

const CHANNEL = aLiveChannel({ name: 'Film Four [Geo-blocked]', number: '15', isFavourite: true });

const ARRIVAL = [aLiveProgramme(CHANNEL.id, 'Arrival', FROM, FROM + HOUR_MS)];

const rowFrom = (from: number, programmes = ARRIVAL) => (
  <GuideRow
    channel={CHANNEL}
    programmes={programmes}
    from={from}
    until={from + 2 * HOUR_MS}
    width={1200}
    now={FROM + 10 * 60 * 1000}
    aimAt={null}
    onAimed={ON_AIMED}
    onWatch={ON_CHANNEL}
    onKeep={ON_CHANNEL}
    onLand={ON_CELL}
    onLeave={ON_CELL}
  />
);

const ON_AIMED = jest.fn();

const ON_CHANNEL = jest.fn();

const ON_CELL = jest.fn();

const drawRow = (programmes = ARRIVAL) =>
  render(
    <GuideRow
      channel={CHANNEL}
      programmes={programmes}
      from={FROM}
      until={FROM + 2 * HOUR_MS}
      width={1200}
      now={FROM + 10 * 60 * 1000}
      aimAt={null}
      onAimed={jest.fn()}
      onWatch={jest.fn()}
      onKeep={jest.fn()}
      onLand={jest.fn()}
      onLeave={jest.fn()}
    />,
  );

describe('GuideRow', () => {
  it('names the channel, without the playlist’s tags, beside its number', async () => {
    const drawn = await drawRow();

    expect(drawn.getByText('Film Four')).toBeOnTheScreen();
    expect(drawn.getByText('15')).toBeOnTheScreen();
  });

  it('lays its programmes across the stretch, with the time after them as a gap', async () => {
    const drawn = await drawRow();

    expect(drawn.getAllByRole('button')).toHaveLength(2);
    expect(drawn.getByRole('button', { name: /: Arrival$/ })).toBeOnTheScreen();
    expect(drawn.getByRole('button', { name: /: No guide$/ })).toBeOnTheScreen();
  });

  it('covers a channel with no guide with one cell saying it is live', async () => {
    const drawn = await drawRow([]);

    expect(drawn.getAllByRole('button')).toHaveLength(1);
    expect(drawn.getByText('Live now · no guide')).toBeOnTheScreen();
  });

  it('keeps the cell the remote may be on as the stretch moves on past its start', async () => {
    const drawn = await render(rowFrom(FROM));
    const before = drawn.getByRole('button', { name: /: Arrival$/ });

    await drawn.rerender(rowFrom(FROM + HOUR_MS / 2));

    expect(drawn.getByRole('button', { name: /: Arrival$/ })).toBe(before);
  });

  it('keeps a channel with no guide in place as the stretch moves on', async () => {
    const drawn = await render(rowFrom(FROM, []));
    const before = drawn.getByRole('button');

    await drawn.rerender(rowFrom(FROM + HOUR_MS / 2, []));

    expect(drawn.getByRole('button')).toBe(before);
  });
});
