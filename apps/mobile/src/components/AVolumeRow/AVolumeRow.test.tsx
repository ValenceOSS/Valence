import { render } from '@testing-library/react-native';
import { AVolumeRow } from './AVolumeRow';

describe('AVolumeRow', () => {
  it('offers the volume as a slider from nothing to all the way up', async () => {
    const drawn = await render(
      <AVolumeRow
        level={1}
        colour="#ffffff"
        quietColour="#999999"
        restColour="#333333"
        onTurning={jest.fn()}
        onTurned={jest.fn()}
      />,
    );

    expect(
      drawn.getByRole('adjustable', { name: 'Volume', value: { now: 1, max: 1 } }),
    ).toBeTruthy();
  });
});
