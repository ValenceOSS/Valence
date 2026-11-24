import { render } from '@testing-library/react-native';
import { StreamTrend } from '@ValenceTv/screens/Player/components/StreamStats/components/StreamTrend/StreamTrend';

type Drawn = Awaited<ReturnType<typeof render>>;

const barsOf = (drawn: Drawn) =>
  drawn
    .getByLabelText('Bitrate over the last minute')
    .queryAll(
      (node) =>
        node.type === 'View' &&
        node.props.style !== undefined &&
        JSON.stringify(node.props.style).includes('"opacity":'),
    )
    .map((node) => JSON.stringify(node.props.style));

describe('StreamTrend', () => {
  it('says what it measures, the newest reading and the top of its scale', async () => {
    const drawn = await render(
      <StreamTrend
        title="Bitrate"
        label="Bitrate over the last minute"
        values={[4000, 6000]}
        ceiling={10_000}
        scale="10 Mbps"
        newest="6.0 Mbps"
        slots={60}
      />,
    );

    expect(drawn.getByLabelText('Bitrate over the last minute')).toBeTruthy();
    expect(drawn.getByText('Bitrate')).toBeTruthy();
    expect(drawn.getByText('6.0 Mbps')).toBeTruthy();
    expect(drawn.getByText('10 Mbps')).toBeTruthy();
  });

  it('draws each reading as a bar against the top of the scale, the newest on the right', async () => {
    const drawn = await render(
      <StreamTrend
        title="Bitrate"
        label="Bitrate over the last minute"
        values={[5000, null, 10_000, 20_000]}
        ceiling={10_000}
        scale="10 Mbps"
        newest="20.0 Mbps"
        slots={4}
      />,
    );
    const bars = barsOf(drawn);

    expect(bars).toHaveLength(3);
    expect(bars[0]).toContain('"height":45');
    expect(bars[1]).toContain('"height":90');
    expect(bars[2]).toContain('"height":90');
    expect(bars[2]).toContain('"opacity":1');
  });

  it('keeps only as many readings as it has room for', async () => {
    const drawn = await render(
      <StreamTrend
        title="Bitrate"
        label="Bitrate over the last minute"
        values={[1, 2, 3, 4, 5]}
        ceiling={10}
        scale="10"
        newest="5"
        slots={2}
      />,
    );

    expect(barsOf(drawn)).toHaveLength(2);
  });

  it('says nothing has been measured before there is a reading', async () => {
    const drawn = await render(
      <StreamTrend
        title="Bitrate"
        label="Bitrate over the last minute"
        values={[null]}
        ceiling={1}
        scale="1"
        newest={null}
        slots={60}
      />,
    );

    expect(drawn.getByText('Nothing measured yet.')).toBeTruthy();
    expect(drawn.getByText('—')).toBeTruthy();
  });
});
