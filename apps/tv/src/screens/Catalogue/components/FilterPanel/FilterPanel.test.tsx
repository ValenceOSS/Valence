import { render, userEvent } from '@testing-library/react-native';
import { FilterPanel } from '@ValenceTv/screens/Catalogue/components/FilterPanel/FilterPanel';

const GROUPS = [
  {
    name: 'Genre',
    isSingle: true,
    options: [
      { id: 'genre:Drama', label: 'Drama' },
      { id: 'genre:Comedy', label: 'Comedy' },
    ],
  },
  { name: 'Decade', isSingle: true, options: [{ id: 'decade:1990', label: '1990s' }] },
];

describe('FilterPanel', () => {
  it('lists the kinds of filter, each saying what it is set to', async () => {
    const drawn = await render(
      <FilterPanel
        groups={GROUPS}
        selected={new Set(['genre:Drama'])}
        onChange={jest.fn()}
        onClose={jest.fn()}
      />,
    );

    expect(drawn.getByRole('button', { name: 'Genre, Drama' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Decade, Any' })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Clear' })).toBeTruthy();
  });

  it('sets one kind, replacing what it was set to and keeping the rest', async () => {
    const onChange = jest.fn();
    const drawn = await render(
      <FilterPanel
        groups={GROUPS}
        selected={new Set(['genre:Drama', 'decade:1990'])}
        onChange={onChange}
        onClose={jest.fn()}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Genre, Drama' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Comedy' }));

    expect(onChange).toHaveBeenCalledWith(new Set(['decade:1990', 'genre:Comedy']));
    expect(drawn.getByRole('button', { name: 'Decade, 1990s' })).toBeTruthy();
  });

  it('takes one kind off with Any', async () => {
    const onChange = jest.fn();
    const drawn = await render(
      <FilterPanel
        groups={GROUPS}
        selected={new Set(['genre:Drama'])}
        onChange={onChange}
        onClose={jest.fn()}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Genre, Drama' }));
    await userEvent.press(drawn.getByRole('button', { name: 'Any' }));

    expect(onChange).toHaveBeenCalledWith(new Set());
  });

  it('clears every filter at once, and offers no clearing with none set', async () => {
    const onChange = jest.fn();
    const drawn = await render(
      <FilterPanel
        groups={GROUPS}
        selected={new Set(['genre:Drama'])}
        onChange={onChange}
        onClose={jest.fn()}
      />,
    );

    await userEvent.press(drawn.getByRole('button', { name: 'Clear' }));

    expect(onChange).toHaveBeenCalledWith(new Set());

    const empty = await render(
      <FilterPanel groups={GROUPS} selected={new Set()} onChange={jest.fn()} onClose={jest.fn()} />,
    );

    expect(empty.queryByRole('button', { name: 'Clear' })).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(FilterPanel.displayName).toBe('FilterPanel');
  });
});
