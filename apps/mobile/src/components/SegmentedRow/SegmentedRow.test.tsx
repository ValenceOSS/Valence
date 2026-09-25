import { render, userEvent } from '@testing-library/react-native';
import { SegmentedRow } from './SegmentedRow';

const TWO = [
  { id: 'films', label: 'Films' },
  { id: 'shows', label: 'Shows' },
] as const;

describe('SegmentedRow', () => {
  it('shows every choice at once, rather than hiding them behind a menu', async () => {
    const drawn = await render(
      <SegmentedRow label="Library" items={TWO} value="films" onSelect={jest.fn()} />,
    );

    expect(drawn.getByText('Films')).toBeTruthy();
    expect(drawn.getByText('Shows')).toBeTruthy();
  });

  it('says which one is picked, so it is not only a colour', async () => {
    const drawn = await render(
      <SegmentedRow label="Library" items={TWO} value="films" onSelect={jest.fn()} />,
    );

    expect(drawn.getByRole('button', { name: 'Films', selected: true })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Shows', selected: false })).toBeTruthy();
  });

  it('says which one they picked', async () => {
    const onSelect = jest.fn();
    const drawn = await render(
      <SegmentedRow label="Library" items={TWO} value="films" onSelect={onSelect} />,
    );

    await userEvent.press(drawn.getByLabelText('Shows'));

    expect(onSelect).toHaveBeenCalledWith('shows');
  });

  it('picks nothing where nothing has been picked yet', async () => {
    const drawn = await render(
      <SegmentedRow label="Library" items={TWO} value={null} onSelect={jest.fn()} />,
    );

    expect(drawn.getByRole('button', { name: 'Films', selected: false })).toBeTruthy();
  });

  it('draws nothing where there is nothing to choose between', async () => {
    const drawn = await render(
      <SegmentedRow label="Library" items={[]} value={null} onSelect={jest.fn()} />,
    );

    expect(drawn.queryByRole('button')).toBeNull();
  });
});
