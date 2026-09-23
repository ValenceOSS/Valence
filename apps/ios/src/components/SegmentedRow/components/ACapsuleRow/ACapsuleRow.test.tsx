import { render, userEvent } from '@testing-library/react-native';
import { ACapsuleRow } from './ACapsuleRow';

const PARTS = [
  { id: 'home', label: 'Home' },
  { id: 'films', label: 'Films' },
];

describe('ACapsuleRow', () => {
  it('offers every choice, and says which is picked', async () => {
    const drawn = await render(
      <ACapsuleRow label="What to show" items={PARTS} value="films" onSelect={jest.fn()} />,
    );

    expect(drawn.getByRole('button', { name: 'Films', selected: true })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Home', selected: false })).toBeTruthy();
  });

  it('says which was pressed', async () => {
    const onSelect = jest.fn();
    const drawn = await render(
      <ACapsuleRow label="What to show" items={PARTS} value="films" onSelect={onSelect} />,
    );

    await userEvent.press(drawn.getByText('Home'));

    expect(onSelect).toHaveBeenCalledWith('home');
  });
});
