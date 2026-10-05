import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { chooseFromTheMenu } from '@ValenceMobile/testing/chooseFromTheMenu';
import { theMenu } from '@ValenceMobile/testing/theMenu';
import { theMenuChoices } from '@ValenceMobile/testing/theMenuChoices';
import { TheFilters } from './TheFilters';

const GROUPS = [
  {
    name: 'Genre',
    options: [
      { id: 'genre:drama', label: 'Drama' },
      { id: 'genre:comedy', label: 'Comedy' },
    ],
  },
];

const NEWEST_FIRST = { order: 'added', isHidingWatched: false } as const;

describe('TheFilters', () => {
  it('says how many filters are on, and clears them', async () => {
    const onClear = jest.fn();
    const drawn = await render(
      <TheFilters
        groups={GROUPS}
        selected={new Set(['genre:drama'])}
        onChange={jest.fn()}
        onClear={onClear}
        arrangement={NEWEST_FIRST}
        onArrange={jest.fn()}
      />,
    );

    expect(drawn.getByText('Filters · 1')).toBeTruthy();

    await userEvent.press(drawn.getByText('Clear'));

    expect(onClear).toHaveBeenCalled();
  });

  it('opens its groups, and picks one filter in each', async () => {
    const onChange = jest.fn();
    const drawn = await render(
      <TheFilters
        groups={GROUPS}
        selected={new Set()}
        onChange={onChange}
        onClear={jest.fn()}
        arrangement={NEWEST_FIRST}
        onArrange={jest.fn()}
      />,
    );

    await userEvent.press(drawn.getByText('Filters'));
    await userEvent.press(drawn.getByText('Comedy'));

    expect(onChange).toHaveBeenCalledWith(new Set(['genre:comedy']));
  });

  it('names the order chosen, and opens the orders to choose another', async () => {
    const onArrange = jest.fn();
    const drawn = await render(
      <TheFilters
        groups={GROUPS}
        selected={new Set()}
        onChange={jest.fn()}
        onClear={jest.fn()}
        arrangement={NEWEST_FIRST}
        onArrange={onArrange}
      />,
    );

    expect(() => theMenu('Order')).toThrow();

    await userEvent.press(drawn.getByRole('button', { name: 'Order, Recently added' }));
    await chooseFromTheMenu('Order', 'released');

    expect(onArrange).toHaveBeenCalledWith({ order: 'released', isHidingWatched: false });
  });

  it('leaves out what has been watched when its switch is turned on', async () => {
    const onArrange = jest.fn();
    const drawn = await render(
      <TheFilters
        groups={GROUPS}
        selected={new Set()}
        onChange={jest.fn()}
        onClear={jest.fn()}
        arrangement={{ order: 'title', isHidingWatched: false }}
        onArrange={onArrange}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Order, Title' }));
    await fireEvent(drawn.getByLabelText('Unwatched only'), 'valueChange', true);

    expect(onArrange).toHaveBeenCalledWith({ order: 'title', isHidingWatched: true });
  });

  it('folds one away when the other opens', async () => {
    const drawn = await render(
      <TheFilters
        groups={GROUPS}
        selected={new Set()}
        onChange={jest.fn()}
        onClear={jest.fn()}
        arrangement={NEWEST_FIRST}
        onArrange={jest.fn()}
      />,
    );

    await userEvent.press(drawn.getByText('Filters'));

    expect(drawn.getByText('Comedy')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Order, Recently added' }));

    expect(drawn.queryByText('Comedy')).toBeNull();
    expect(theMenuChoices('Order')).toContain('Release date');
  });
});
