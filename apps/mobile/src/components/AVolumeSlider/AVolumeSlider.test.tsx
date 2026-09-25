import { render } from '@testing-library/react-native';
import { AVolumeSlider } from './AVolumeSlider';

describe('AVolumeSlider', () => {
  it('offers the volume as a slider, loud until the phone says otherwise', async () => {
    const drawn = await render(<AVolumeSlider />);

    expect(
      drawn.getByRole('adjustable', { name: 'Volume', value: { now: 1, max: 1 } }),
    ).toBeTruthy();
  });
});
