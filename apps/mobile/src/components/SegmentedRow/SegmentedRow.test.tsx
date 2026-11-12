import { fireEvent, render, userEvent } from '@testing-library/react-native';
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

  it('keeps room at its end for the fade only where its choices run past the edge', async () => {
    const drawn = await render(
      <SegmentedRow label="Season" items={TWO} value="films" onSelect={jest.fn()} />,
    );
    const row = drawn.getByLabelText('Season').parent?.parent;
    if (row === null || row === undefined) {
      throw new Error('The row is not inside a scroll view.');
    }

    await fireEvent(row, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 40 } },
    });
    await fireEvent(row, 'contentSizeChange', 160, 40);

    expect(row).toHaveProp('contentContainerStyle', null);

    await fireEvent(row, 'contentSizeChange', 320, 40);

    expect(row).toHaveProp('contentContainerStyle', { paddingRight: 24 });
  });

  it('fills its width where its choices fit across it, sat flush and unclipped', async () => {
    const drawn = await render(
      <SegmentedRow label="Season" items={TWO} value="films" onSelect={jest.fn()} fills />,
    );
    const row = drawn.getByLabelText('Season').parent?.parent;
    if (row === null || row === undefined) {
      throw new Error('The row is not inside a scroll view.');
    }

    await fireEvent(row, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 40 } },
    });
    await fireEvent(row, 'contentSizeChange', 200, 40);

    expect(row).toHaveProp('contentContainerStyle', { flexGrow: 1 });
    expect(row.parent).not.toHaveStyle({ overflow: 'hidden' });
  });

  it('scrolls one asked to fill its width where its choices run past it, its capsule clipped round', async () => {
    const drawn = await render(
      <SegmentedRow label="Season" items={TWO} value="films" onSelect={jest.fn()} fills />,
    );
    const row = drawn.getByLabelText('Season').parent?.parent;
    if (row === null || row === undefined) {
      throw new Error('The row is not inside a scroll view.');
    }

    await fireEvent(row, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 40 } },
    });
    await fireEvent(row, 'contentSizeChange', 320, 40);

    expect(row).toHaveProp('contentContainerStyle', { paddingRight: 24 });
    expect(row.parent).toHaveStyle({ borderRadius: 999, overflow: 'hidden' });
  });

  it('counts a choice running past by less than a point as fitting', async () => {
    const drawn = await render(
      <SegmentedRow label="Season" items={TWO} value="films" onSelect={jest.fn()} fills />,
    );
    const row = drawn.getByLabelText('Season').parent?.parent;
    if (row === null || row === undefined) {
      throw new Error('The row is not inside a scroll view.');
    }

    await fireEvent(row, 'layout', {
      nativeEvent: { layout: { x: 0, y: 0, width: 200, height: 40 } },
    });
    await fireEvent(row, 'contentSizeChange', 200.5, 40);

    expect(row).toHaveProp('contentContainerStyle', { flexGrow: 1 });
  });
});
