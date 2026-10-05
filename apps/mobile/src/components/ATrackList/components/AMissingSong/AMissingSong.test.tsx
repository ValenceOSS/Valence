import { fireEvent, render } from '@testing-library/react-native';
import { ActionSheetIOS } from 'react-native';
import { AMissingSong } from './AMissingSong';

describe('AMissingSong', () => {
  it('names the song, who it is by and that the library does not have it', async () => {
    const drawn = await render(
      <AMissingSong title="Low Tide" artist="Mara Quill" hasCover coverUrl={null} />,
    );

    expect(drawn.getByText('Low Tide')).toBeTruthy();
    expect(drawn.getByText('Mara Quill · Not in your library')).toBeTruthy();
    expect(drawn.queryByLabelText('More for Low Tide')).toBeNull();
  });

  it('finds its album to request when pressed, where somebody may', async () => {
    const onChoose = jest.fn();
    const drawn = await render(
      <AMissingSong
        title="Low Tide"
        artist="Mara Quill"
        hasCover
        coverUrl={null}
        onChoose={onChoose}
      />,
    );

    await fireEvent.press(drawn.getByLabelText('Request the album Low Tide is on'));

    expect(onChoose).toHaveBeenCalledTimes(1);
  });

  it('takes it out of a playlist of yours from its menu', async () => {
    const onRemove = jest.fn();

    jest.spyOn(ActionSheetIOS, 'showActionSheetWithOptions').mockImplementation((asked, told) => {
      told(asked.options.indexOf('Remove from this playlist'));
    });

    const drawn = await render(
      <AMissingSong
        title="Low Tide"
        artist="Mara Quill"
        hasCover={false}
        coverUrl={null}
        onRemove={onRemove}
      />,
    );

    await fireEvent.press(drawn.getByLabelText('More for Low Tide'));

    expect(onRemove).toHaveBeenCalledTimes(1);
  });
});
