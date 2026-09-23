import { createRef } from 'react';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { MusicShortcut } from '@ValenceTv/components/MusicShortcut/MusicShortcut';
import type { View } from 'react-native';
import type { MusicItem } from '@ValenceTv/music/MusicItem';

const PLAYLIST: MusicItem = {
  kind: 'playlist',
  id: '00000000-0000-4000-8000-000000000001',
  title: 'Late Night',
  detail: 'Playlist',
  art: null,
  view: { kind: 'playlist', id: '00000000-0000-4000-8000-000000000001' },
};

describe('MusicShortcut', () => {
  it('is named for what it opens and opens it', async () => {
    const onPress = jest.fn();
    const drawn = await render(<MusicShortcut item={PLAYLIST} width={400} onPress={onPress} />);

    expect(drawn.getByText('Late Night')).toBeOnTheScreen();

    await userEvent.press(drawn.getByRole('button', { name: 'Late Night' }));

    expect(onPress).toHaveBeenCalledWith(PLAYLIST);
  });

  it('says when the remote lands on it', async () => {
    const onFocus = jest.fn();
    const drawn = await render(
      <MusicShortcut item={PLAYLIST} width={400} onPress={jest.fn()} onFocus={onFocus} />,
    );

    await fireEvent(drawn.getByRole('button', { name: 'Late Night' }), 'focus');

    expect(onFocus).toHaveBeenCalledWith(PLAYLIST);
  });

  it('is rung in white while the remote is on it', async () => {
    const drawn = await render(<MusicShortcut item={PLAYLIST} width={400} onPress={jest.fn()} />);
    const shortcut = drawn.getByRole('button', { name: 'Late Night' });

    await fireEvent(shortcut, 'focus');

    expect(drawn.getByText('Late Night').parent).toHaveStyle({ borderColor: '#ffffff' });

    await fireEvent(shortcut, 'blur');

    expect(drawn.getByText('Late Night').parent).toHaveStyle({ borderColor: 'transparent' });
  });

  it('hands itself over for the remote to be sent to it', async () => {
    const ref = createRef<View>();

    await render(<MusicShortcut item={PLAYLIST} width={400} onPress={jest.fn()} ref={ref} />);

    expect(ref.current).not.toBeNull();
  });
});
