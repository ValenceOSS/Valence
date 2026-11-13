import { fireEvent, render, screen } from '@testing-library/react-native';
import { APhotoFilters } from './APhotoFilters';

describe('APhotoFilters', () => {
  it('offers every filter, the chosen one marked, and tells which is pressed', async () => {
    const onChoose = jest.fn();

    await render(
      <APhotoFilters
        uri="file:///chosen.jpg"
        frame={{ zoom: 1, x: 0, y: 0 }}
        chosen="original"
        onChoose={onChoose}
      />,
    );

    expect(screen.getByRole('button', { name: 'Original' })).toBeSelected();

    await fireEvent.press(screen.getByRole('button', { name: 'Neon' }));

    expect(onChoose).toHaveBeenCalledWith('neon');
  });
});
