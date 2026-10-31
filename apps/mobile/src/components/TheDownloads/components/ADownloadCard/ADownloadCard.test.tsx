import { render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ADownloadCard } from './ADownloadCard';

describe('ADownloadCard', () => {
  it('names it, says what it is and where it stands, and holds what can be done', async () => {
    const drawn = await render(
      <ADownloadCard
        title="Arrival"
        artwork={null}
        facts={['1080p', '2.1 GB', '1h 56m']}
        says="On this phone"
        isFailed={false}
        fraction={null}
        progressLabel="How far Arrival has downloaded"
      >
        <Text>Play</Text>
      </ADownloadCard>,
    );

    expect(drawn.getByText('Arrival')).toBeTruthy();
    expect(drawn.getByText('1080p · 2.1 GB · 1h 56m')).toBeTruthy();
    expect(drawn.getByText('On this phone')).toBeTruthy();
    expect(drawn.getByText('Play')).toBeTruthy();
  });
});
