import { render, userEvent } from '@testing-library/react-native';
import { AFilterChips } from './AFilterChips';

const CHIPS = [
  { id: 'all', label: 'All' },
  { id: 'albums', label: 'Albums' },
];

describe('AFilterChips', () => {
  it('marks the chip chosen, and says which one was pressed', async () => {
    const onSelect = jest.fn();
    const drawn = await render(
      <AFilterChips label="Music" chips={CHIPS} value="all" onSelect={onSelect} />,
    );

    expect(drawn.getByRole('button', { name: 'All' })).toBeSelected();
    expect(drawn.getByRole('button', { name: 'Albums' })).not.toBeSelected();

    await userEvent.press(drawn.getByRole('button', { name: 'Albums' }));

    expect(onSelect).toHaveBeenCalledWith('albums');
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AFilterChips.displayName).toBe('AFilterChips');
  });
});
