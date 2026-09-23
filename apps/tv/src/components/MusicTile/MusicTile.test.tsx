import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { MusicTile } from '@ValenceTv/components/MusicTile/MusicTile';
import type { MusicItem } from '@ValenceTv/music/MusicItem';

const ALBUM: MusicItem = {
  kind: 'album',
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Even In Arcadia',
  detail: 'Sleep Token • Album',
  art: null,
  view: { kind: 'album', id: '00000000-0000-4000-8000-000000000001' },
};

describe('MusicTile', () => {
  it('shows its name and what it is', async () => {
    const drawn = await render(<MusicTile item={ALBUM} onPress={jest.fn()} />);

    expect(drawn.getByText('Even In Arcadia')).toBeOnTheScreen();
    expect(drawn.getByText('Sleep Token • Album')).toBeOnTheScreen();
  });

  it('hands back what it is when chosen', async () => {
    const onPress = jest.fn();
    const drawn = await render(<MusicTile item={ALBUM} onPress={onPress} />);

    await userEvent.press(
      drawn.getByRole('button', { name: 'Even In Arcadia, Sleep Token • Album' }),
    );

    expect(onPress).toHaveBeenCalledWith(ALBUM);
  });

  it('says when the remote lands on it', async () => {
    const onFocus = jest.fn();
    const drawn = await render(<MusicTile item={ALBUM} onPress={jest.fn()} onFocus={onFocus} />);

    await fireEvent(
      drawn.getByRole('button', { name: 'Even In Arcadia, Sleep Token • Album' }),
      'focus',
    );

    expect(onFocus).toHaveBeenCalledWith(ALBUM);
  });

  it('centres an artist beneath their picture', async () => {
    const drawn = await render(
      <MusicTile
        item={{ ...ALBUM, kind: 'artist', title: 'Sleep Token', detail: 'Artist' }}
        onPress={jest.fn()}
      />,
    );

    expect(drawn.getByText('Sleep Token')).toHaveStyle({ textAlign: 'center' });
  });
});
