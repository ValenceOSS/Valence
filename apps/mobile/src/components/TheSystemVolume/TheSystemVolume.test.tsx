import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { TheSystemVolume } from './TheSystemVolume';

describe('TheSystemVolume', () => {
  it('draws nothing a person can see or reach', async () => {
    const drawn = await render(<TheSystemVolume />);

    expect(drawn.queryByRole('adjustable')).toBeNull();
    expect(drawn.queryByRole('button')).toBeNull();
  });

  it('draws nothing at all where the phone is not an iPhone', async () => {
    const was = Platform.OS;

    Platform.OS = 'android';

    const drawn = await render(<TheSystemVolume />);

    expect(drawn.toJSON()).toBeNull();

    Platform.OS = was;
  });
});
