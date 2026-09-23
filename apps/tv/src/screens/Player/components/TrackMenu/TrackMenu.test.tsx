import { render, userEvent } from '@testing-library/react-native';
import { TrackMenu } from '@ValenceTv/screens/Player/components/TrackMenu/TrackMenu';

const CHOICES = [
  { id: 'off', label: 'Off' },
  { id: 'en', label: 'English' },
  { id: 'fr', label: 'French' },
] as const;

describe('TrackMenu', () => {
  it('lists what there is to choose under what is being chosen', async () => {
    const drawn = await render(
      <TrackMenu title="Subtitles" choices={CHOICES} chosen="en" onChoose={jest.fn()} />,
    );

    expect(drawn.getByText('Subtitles')).toBeTruthy();
    expect(drawn.getAllByRole('button')).toEqual([
      drawn.getByRole('button', { name: 'Off' }),
      drawn.getByRole('button', { name: 'English' }),
      drawn.getByRole('button', { name: 'French' }),
    ]);
  });

  it('says which was chosen', async () => {
    const onChoose = jest.fn();
    const drawn = await render(
      <TrackMenu title="Subtitles" choices={CHOICES} chosen="en" onChoose={onChoose} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'French' }));

    expect(onChoose).toHaveBeenCalledWith('fr');
  });

  it('starts the remote on the one in use', async () => {
    const drawn = await render(
      <TrackMenu title="Subtitles" choices={CHOICES} chosen="en" onChoose={jest.fn()} />,
    );

    expect(drawn.getByRole('button', { name: 'English' })).toHaveProp('hasTVPreferredFocus', true);
    expect(drawn.getByRole('button', { name: 'Off' })).toHaveProp('hasTVPreferredFocus', false);
  });
});
