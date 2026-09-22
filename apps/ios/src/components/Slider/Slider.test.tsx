import { fireEvent, render } from '@testing-library/react-native';
import { Slider } from './Slider';

const COLOURS = { colour: '#0066ff', restColour: '#333333', aheadColour: '#777777' };

const aSlider = (overrides: Partial<Parameters<typeof Slider>[0]> = {}) => (
  <Slider
    label="Seek through Arrival"
    value={30}
    furthest={120}
    buffered={60}
    onScrubbed={jest.fn()}
    {...COLOURS}
    {...overrides}
  />
);

describe('Slider', () => {
  it('says where the thing is, for anybody who cannot see the line', async () => {
    const drawn = await render(aSlider());

    expect(
      drawn.getByRole('adjustable', {
        name: 'Seek through Arrival',
        value: { min: 0, max: 120, now: 30 },
      }),
    ).toBeTruthy();
  });

  it('rounds what it says to something a voice can read out', async () => {
    const drawn = await render(aSlider({ value: 30.4, furthest: 119.6 }));

    expect(
      drawn.getByRole('adjustable', { name: 'Seek through Arrival', value: { now: 30, max: 120 } }),
    ).toBeTruthy();
  });

  it('can be moved by somebody who cannot drag a line at all', async () => {
    const onScrubbed = jest.fn();
    const drawn = await render(aSlider({ onScrubbed }));

    await fireEvent(drawn.getByLabelText('Seek through Arrival'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });

    expect(onScrubbed).toHaveBeenCalledWith(40);
  });

  it('can be moved back the same way', async () => {
    const onScrubbed = jest.fn();
    const drawn = await render(aSlider({ onScrubbed }));

    await fireEvent(drawn.getByLabelText('Seek through Arrival'), 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });

    expect(onScrubbed).toHaveBeenCalledWith(20);
  });

  it('will not be stepped past the end', async () => {
    const onScrubbed = jest.fn();
    const drawn = await render(aSlider({ onScrubbed, value: 118 }));

    await fireEvent(drawn.getByLabelText('Seek through Arrival'), 'accessibilityAction', {
      nativeEvent: { actionName: 'increment' },
    });

    expect(onScrubbed).toHaveBeenCalledWith(120);
  });

  it('will not be stepped before the beginning', async () => {
    const onScrubbed = jest.fn();
    const drawn = await render(aSlider({ onScrubbed, value: 3 }));

    await fireEvent(drawn.getByLabelText('Seek through Arrival'), 'accessibilityAction', {
      nativeEvent: { actionName: 'decrement' },
    });

    expect(onScrubbed).toHaveBeenCalledWith(0);
  });

  it('manages a thing of no length without dividing by it', async () => {
    const drawn = await render(aSlider({ value: 0, furthest: 0 }));

    expect(drawn.getByLabelText('Seek through Arrival')).toBeTruthy();
  });
});
