import { render, userEvent } from '@testing-library/react-native';
import { SettingsMenu } from '@ValenceTv/screens/Player/components/SettingsMenu/SettingsMenu';

const SETTINGS = [
  { id: 'quality', label: 'Quality', value: 'Original' },
  { id: 'subtitles', label: 'Subtitles', value: 'English' },
  { id: 'speed', label: 'Speed', value: 'Normal' },
] as const;

describe('SettingsMenu', () => {
  it('names what the settings are of, where they are not the player’s own', async () => {
    const drawn = await render(
      <SettingsMenu title="Caption style" settings={SETTINGS} onOpen={jest.fn()} />,
    );

    expect(drawn.getByText('Caption style')).toBeTruthy();
    expect(drawn.queryByText('Settings')).toBeNull();
  });

  it('lists each setting with what it is set to now', async () => {
    const drawn = await render(<SettingsMenu settings={SETTINGS} onOpen={jest.fn()} />);

    expect(drawn.getByText('Settings')).toBeTruthy();
    expect(drawn.getAllByRole('button')).toEqual([
      drawn.getByRole('button', { name: 'Quality, Original' }),
      drawn.getByRole('button', { name: 'Subtitles, English' }),
      drawn.getByRole('button', { name: 'Speed, Normal' }),
    ]);
    expect(drawn.getByText('English')).toBeTruthy();
  });

  it('says which setting was chosen, to show its choices', async () => {
    const onOpen = jest.fn();
    const drawn = await render(<SettingsMenu settings={SETTINGS} onOpen={onOpen} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Subtitles, English' }));

    expect(onOpen).toHaveBeenCalledWith('subtitles');
  });

  it('starts the remote on the first setting', async () => {
    const drawn = await render(<SettingsMenu settings={SETTINGS} onOpen={jest.fn()} />);

    expect(drawn.getByRole('button', { name: 'Quality, Original' })).toHaveProp(
      'hasTVPreferredFocus',
      true,
    );
    expect(drawn.getByRole('button', { name: 'Speed, Normal' })).toHaveProp(
      'hasTVPreferredFocus',
      false,
    );
  });

  it('starts the remote back on the setting whose choices were just closed', async () => {
    const drawn = await render(
      <SettingsMenu settings={SETTINGS} onOpen={jest.fn()} cameFrom="speed" />,
    );

    expect(drawn.getByRole('button', { name: 'Speed, Normal' })).toHaveProp(
      'hasTVPreferredFocus',
      true,
    );
    expect(drawn.getByRole('button', { name: 'Quality, Original' })).toHaveProp(
      'hasTVPreferredFocus',
      false,
    );
  });
});
