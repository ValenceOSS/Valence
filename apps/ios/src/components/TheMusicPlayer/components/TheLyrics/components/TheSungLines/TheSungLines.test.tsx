import { render, userEvent } from '@testing-library/react-native';
import { TheSungLines } from './TheSungLines';

describe('TheSungLines', () => {
  it('shows the words, and plays from a timed line when pressed', async () => {
    const onSeek = jest.fn();
    const drawn = await render(
      <TheSungLines
        lines={[
          { atMs: 1000, text: 'It’s so cold in this house' },
          { atMs: 5000, text: 'Open mouth swallowing us' },
        ]}
        isSynced
        sung={0}
        onSeek={onSeek}
      />,
    );

    await userEvent.press(
      drawn.getByRole('button', { name: 'Play from “Open mouth swallowing us”' }),
    );

    expect(onSeek).toHaveBeenCalledWith(5);
  });

  it('lists words that are not timed without offering to play from them', async () => {
    const drawn = await render(
      <TheSungLines
        lines={[{ atMs: null, text: 'Far away' }]}
        isSynced={false}
        sung={-1}
        onSeek={jest.fn()}
      />,
    );

    expect(drawn.getByText('Far away')).toBeTruthy();
    expect(drawn.queryByRole('button')).toBeNull();
  });
});
