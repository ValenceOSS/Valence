import { MusicNote } from '@keyline-icons/react-native';
import { render, userEvent } from '@testing-library/react-native';
import { AMusicHead } from './AMusicHead';

const aHead = (canPlay: boolean) => {
  const onPlay = jest.fn();
  const onShuffle = jest.fn();

  return {
    onPlay,
    onShuffle,
    head: (
      <AMusicHead
        kind="Album"
        title="Even In Arcadia"
        detail="2025 · 10 songs"
        artwork={null}
        standIn={MusicNote}
        canPlay={canPlay}
        onPlay={onPlay}
        onShuffle={onShuffle}
      />
    ),
  };
};

describe('AMusicHead', () => {
  it('says what it is and plays it, in order or shuffled', async () => {
    const { head, onPlay, onShuffle } = aHead(true);
    const drawn = await render(head);

    expect(drawn.getByText('Even In Arcadia')).toBeTruthy();
    expect(drawn.getByText('2025 · 10 songs')).toBeTruthy();

    await userEvent.press(drawn.getByText('Play'));
    await userEvent.press(drawn.getByText('Shuffle'));

    expect(onPlay).toHaveBeenCalled();
    expect(onShuffle).toHaveBeenCalled();
  });

  it('offers no way to play where there is nothing to play', async () => {
    const drawn = await render(aHead(false).head);

    expect(drawn.queryByText('Play')).toBeNull();
  });
});
