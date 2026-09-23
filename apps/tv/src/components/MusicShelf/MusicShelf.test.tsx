import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { MusicShelf } from '@ValenceTv/components/MusicShelf/MusicShelf';
import type { MusicItem } from '@ValenceTv/music/MusicItem';

const ALBUM: MusicItem = {
  kind: 'album',
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Even In Arcadia',
  detail: 'Sleep Token • Album',
  art: null,
  view: { kind: 'album', id: '00000000-0000-4000-8000-000000000001' },
};

const ARTIST: MusicItem = {
  kind: 'artist',
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Sleep Token',
  detail: 'Artist',
  art: null,
  view: { kind: 'artist', id: '00000000-0000-4000-8000-000000000001' },
};

describe('MusicShelf', () => {
  it('names the row and shows what is on it', async () => {
    const drawn = await render(
      <MusicShelf title="Recently played" items={[ALBUM, ARTIST]} onOpen={jest.fn()} />,
    );

    expect(drawn.getByText('Recently played')).toBeOnTheScreen();
    expect(
      drawn.getByRole('button', { name: 'Even In Arcadia, Sleep Token • Album' }),
    ).toBeOnTheScreen();
    expect(drawn.getByRole('button', { name: 'Sleep Token, Artist' })).toBeOnTheScreen();
  });

  it('says which was chosen', async () => {
    const onOpen = jest.fn();
    const drawn = await render(
      <MusicShelf title="Recently played" items={[ALBUM, ARTIST]} onOpen={onOpen} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Sleep Token, Artist' }));

    expect(onOpen).toHaveBeenCalledWith(ARTIST);
  });

  it('says which the remote is on', async () => {
    const onFocus = jest.fn();
    const drawn = await render(
      <MusicShelf title="Recently played" items={[ALBUM]} onOpen={jest.fn()} onFocus={onFocus} />,
    );

    await fireEvent(
      drawn.getByRole('button', { name: 'Even In Arcadia, Sleep Token • Album' }),
      'focus',
    );

    expect(onFocus).toHaveBeenCalledWith(ALBUM);
  });
});
