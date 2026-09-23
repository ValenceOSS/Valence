import { fireEvent, render } from '@testing-library/react-native';
import { Toggle } from './Toggle';

describe('Toggle', () => {
  it('is named for what it turns on', async () => {
    const drawn = await render(<Toggle label="Season 1" isOn={false} onToggle={jest.fn()} />);

    expect(drawn.getByRole('switch', { name: 'Season 1' })).toBeTruthy();
  });

  it('says what it was turned to', async () => {
    const onToggle = jest.fn();
    const drawn = await render(<Toggle label="Season 1" isOn={false} onToggle={onToggle} />);

    await fireEvent(drawn.getByRole('switch', { name: 'Season 1' }), 'valueChange', true);

    expect(onToggle).toHaveBeenCalledWith(true);
  });

  it('shows whether it is on', async () => {
    const drawn = await render(<Toggle label="Season 1" isOn onToggle={jest.fn()} />);

    expect(drawn.getByRole('switch', { name: 'Season 1', checked: true })).toBeTruthy();
  });
});
