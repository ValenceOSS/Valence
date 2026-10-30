import { render, userEvent } from '@testing-library/react-native';
import { TheQuality } from './TheQuality';

describe('TheQuality', () => {
  it('names each quality with what it costs a line apiece, and plays the one pressed', async () => {
    const onChoose = jest.fn();
    const drawn = await render(
      <TheQuality
        set={{
          heading: 'Quality',
          chosen: 'auto',
          onChoose,
          choices: [
            { id: 'auto', label: 'Auto', detail: 'Moves with your connection' },
            { id: '480', label: '480p', detail: 'up to 709 kbps · ~523 MB' },
          ],
        }}
      />,
    );

    expect(drawn.getByText('up to 709 kbps')).toBeTruthy();
    expect(drawn.getByText('~523 MB')).toBeTruthy();

    await userEvent.press(drawn.getByLabelText('480p'));

    expect(onChoose).toHaveBeenCalledWith('480');
  });
});
