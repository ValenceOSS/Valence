import { render, userEvent } from '@testing-library/react-native';
import { WherePanel } from '@ValenceTv/screens/Catalogue/components/WherePanel/WherePanel';

const OPTIONS = [
  { id: 'all', label: 'Everywhere' },
  { id: 'here', label: 'Here' },
  { id: 'from:films', label: 'Films' },
];

describe('WherePanel', () => {
  it('offers everywhere, here and each linked server', async () => {
    const drawn = await render(
      <WherePanel options={OPTIONS} chosen="all" onChoose={jest.fn()} onClose={jest.fn()} />,
    );

    expect(drawn.getByText('Where')).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Everywhere' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Here' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Films' })).toBeTruthy();
  });

  it('tells the one chosen, and puts itself away', async () => {
    const onChoose = jest.fn();
    const onClose = jest.fn();
    const drawn = await render(
      <WherePanel options={OPTIONS} chosen="all" onChoose={onChoose} onClose={onClose} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Films' }));

    expect(onChoose).toHaveBeenCalledWith('from:films');
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
