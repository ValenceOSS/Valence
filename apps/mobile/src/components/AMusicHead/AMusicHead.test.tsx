import { ListPlus } from '@keyline-icons/react-native';
import { render, userEvent } from '@testing-library/react-native';
import { ARoundAction } from '@ValenceMobile/components/ARoundAction/ARoundAction';
import { AMusicHead } from './AMusicHead';

/**
 * A head for a test, with something to play or nothing.
 *
 * @param canPlay - Whether there is anything to play.
 * @returns The head and what it tells.
 */
const aHead = (canPlay: boolean) => {
  const onPlay = jest.fn();
  const onShuffle = jest.fn();
  const onAdd = jest.fn();

  return {
    onPlay,
    onShuffle,
    onAdd,
    head: (
      <AMusicHead
        kind="Album"
        detail="2025 · 10 songs"
        canPlay={canPlay}
        onPlay={onPlay}
        onShuffle={onShuffle}
      >
        <ARoundAction icon={ListPlus} says="Add to playlist" onPress={onAdd} />
      </AMusicHead>
    ),
  };
};

describe('AMusicHead', () => {
  it('says what it is and plays it, in order or shuffled', async () => {
    const { head, onPlay, onShuffle } = aHead(true);
    const drawn = await render(head);

    expect(drawn.getByText('Album · 2025 · 10 songs')).toBeTruthy();

    await userEvent.press(drawn.getByText('Play'));
    await userEvent.press(drawn.getByLabelText('Shuffle'));

    expect(onPlay).toHaveBeenCalled();
    expect(onShuffle).toHaveBeenCalled();
  });

  it('offers what else there is to do with it as round buttons', async () => {
    const { head, onAdd } = aHead(true);
    const drawn = await render(head);

    await userEvent.press(drawn.getByLabelText('Add to playlist'));

    expect(onAdd).toHaveBeenCalled();
  });

  it('offers no way to play where there is nothing to play', async () => {
    const drawn = await render(aHead(false).head);

    expect(drawn.queryByText('Play')).toBeNull();
    expect(drawn.queryByLabelText('Shuffle')).toBeNull();
  });
});
