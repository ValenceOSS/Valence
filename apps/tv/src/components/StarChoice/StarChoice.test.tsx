import { render, userEvent } from '@testing-library/react-native';
import { StarChoice } from '@ValenceTv/components/StarChoice/StarChoice';

describe('StarChoice', () => {
  it('offers five stars down to one, and nothing to take back before anything is given', async () => {
    const drawn = await render(<StarChoice title="Dune" given={null} onChoose={jest.fn()} />);

    expect(drawn.getByText('Dune')).toBeOnTheScreen();
    expect(drawn.getAllByRole('button')).toEqual(
      ['5 stars', '4 stars', '3 stars', '2 stars', '1 star'].map((name) =>
        drawn.getByRole('button', { name }),
      ),
    );
  });

  it('hands back how many stars were chosen', async () => {
    const onChoose = jest.fn();
    const drawn = await render(<StarChoice title="Dune" given={null} onChoose={onChoose} />);

    await userEvent.press(drawn.getByRole('button', { name: '4 stars' }));

    expect(onChoose).toHaveBeenCalledWith(4);
  });

  it('takes a rating back from the foot of the list', async () => {
    const onChoose = jest.fn();
    const drawn = await render(<StarChoice title="Dune" given={3} onChoose={onChoose} />);

    await userEvent.press(drawn.getByRole('button', { name: 'Remove my rating' }));

    expect(onChoose).toHaveBeenCalledWith(null);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(StarChoice.displayName).toBe('StarChoice');
  });
});
