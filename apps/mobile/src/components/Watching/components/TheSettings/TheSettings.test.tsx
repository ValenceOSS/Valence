import { Gauge } from '@keyline-icons/react-native/fill';
import { render, userEvent } from '@testing-library/react-native';
import { TheSettings } from './TheSettings';

describe('TheSettings', () => {
  it('lists each setting with what it is set to, and opens the one pressed', async () => {
    const onSpeed = jest.fn();
    const drawn = await render(
      <TheSettings
        settings={[{ icon: Gauge, label: 'Playback speed', value: 'Normal', onPress: onSpeed }]}
        onClose={jest.fn()}
      />,
    );

    expect(drawn.getByText('Normal')).toBeTruthy();

    await userEvent.press(drawn.getByLabelText('Playback speed'));

    expect(onSpeed).toHaveBeenCalled();
  });
});
