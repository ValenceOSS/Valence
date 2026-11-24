import { render } from '@testing-library/react-native';
import { StatsGroup } from '@ValenceTv/screens/Player/components/StreamStats/components/StatsGroup/StatsGroup';

describe('StatsGroup', () => {
  it('names the group and lays out each fact beside its name', async () => {
    const drawn = await render(
      <StatsGroup
        name="Output"
        rows={[
          ['Size', '1920x1080'],
          ['Frame rate', '23.976fps'],
        ]}
      />,
    );

    expect(drawn.getByText('Output')).toBeTruthy();
    expect(drawn.getByText('Size')).toBeTruthy();
    expect(drawn.getByText('1920x1080')).toBeTruthy();
    expect(drawn.getByText('23.976fps')).toBeTruthy();
  });

  it('lets a long fact wrap onto a second line rather than run off the card', async () => {
    const drawn = await render(
      <StatsGroup name="Plan" rows={[['Video', 'transcode — too large (1920x1080 @ 8000kbps)']]} />,
    );

    expect(drawn.getByText('transcode — too large (1920x1080 @ 8000kbps)')).toHaveProp(
      'numberOfLines',
      2,
    );
  });
});
