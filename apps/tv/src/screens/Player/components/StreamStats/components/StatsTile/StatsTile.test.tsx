import { render } from '@testing-library/react-native';
import { StatsTile } from '@ValenceTv/screens/Player/components/StreamStats/components/StatsTile/StatsTile';

describe('StatsTile', () => {
  it('names the figure and gives it', async () => {
    const drawn = await render(<StatsTile label="Bitrate" value="7.7 Mbps" />);

    expect(drawn.getByText('Bitrate')).toBeTruthy();
    expect(drawn.getByText('7.7 Mbps')).toBeTruthy();
  });

  it('draws a quiet dash for a figure not known yet', async () => {
    const drawn = await render(<StatsTile label="Mode" value={null} />);

    expect(drawn.getByText('—')).toBeTruthy();
  });
});
