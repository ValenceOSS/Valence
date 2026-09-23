import { render, userEvent } from '@testing-library/react-native';
import { TheFilters } from './TheFilters';
import { chooseIn } from '@ValencePhone/testing/chooseIn';

const GROUPS = [
  {
    name: 'Genre',
    options: [
      { id: 'genre:drama', label: 'Drama' },
      { id: 'genre:comedy', label: 'Comedy' },
    ],
  },
];

describe('TheFilters', () => {
  it('says how many filters are on, and clears them', async () => {
    const onClear = jest.fn();
    const drawn = await render(
      <TheFilters
        groups={GROUPS}
        selected={new Set(['genre:drama'])}
        onChange={jest.fn()}
        onClear={onClear}
      />,
    );

    expect(drawn.getByText('Filters · 1')).toBeTruthy();

    await userEvent.press(drawn.getByText('Clear'));

    expect(onClear).toHaveBeenCalled();
  });

  it('opens its groups, and picks one filter in each', async () => {
    const onChange = jest.fn();
    const drawn = await render(
      <TheFilters groups={GROUPS} selected={new Set()} onChange={onChange} onClear={jest.fn()} />,
    );

    await userEvent.press(drawn.getByText('Filters'));
    await chooseIn('Genre', 'Comedy');

    expect(onChange).toHaveBeenCalledWith(new Set(['genre:comedy']));
  });
});
