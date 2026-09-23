import { createElement as mockCreateElement } from 'react';
import { View as mockView } from 'react-native';
import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { SegmentedRow } from './SegmentedRow';

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireNativeView: (name: string) => (props: object) =>
    mockCreateElement(mockView, { ...props, testID: name }),
}));

const TWO = [
  { id: 'films', label: 'Films' },
  { id: 'shows', label: 'Shows' },
] as const;

const MORE_THAN_FIT = [
  ...TWO,
  { id: 'music', label: 'Music' },
  { id: 'books', label: 'Books' },
  { id: 'kids', label: 'Kids' },
  { id: 'anime', label: 'Anime' },
] as const;

describe('SegmentedRow, asked to be the system control', () => {
  it('is the system control, holding every choice', async () => {
    const drawn = await render(
      <SegmentedRow label="Library" items={TWO} value="shows" onSelect={jest.fn()} isSystem />,
    );

    expect(drawn.getByTestId('ValenceSegmentedControl')).toHaveProp('labels', ['Films', 'Shows']);
    expect(drawn.getByTestId('ValenceSegmentedControl')).toHaveProp('picked', 1);
  });

  it('says which one they picked there', async () => {
    const onSelect = jest.fn();
    const drawn = await render(
      <SegmentedRow label="Library" items={TWO} value="films" onSelect={onSelect} isSystem />,
    );

    await fireEvent(drawn.getByTestId('ValenceSegmentedControl'), 'choose', {
      nativeEvent: { index: 1 },
    });

    expect(onSelect).toHaveBeenCalledWith('shows');
  });

  it('is pills where it scrolls, however few it holds', async () => {
    const drawn = await render(
      <SegmentedRow
        label="Library"
        items={TWO}
        value="films"
        onSelect={jest.fn()}
        scrolls
        isSystem
      />,
    );

    expect(drawn.queryByTestId('ValenceSegmentedControl')).toBeNull();
    expect(drawn.getByRole('button', { name: 'Films', selected: true })).toBeTruthy();
  });
});

describe('SegmentedRow, as pills', () => {
  it('is pills for a few too, where it is not asked to be the system control', async () => {
    const drawn = await render(
      <SegmentedRow label="Library" items={TWO} value="films" onSelect={jest.fn()} />,
    );

    expect(drawn.queryByTestId('ValenceSegmentedControl')).toBeNull();
    expect(drawn.getByRole('button', { name: 'Films', selected: true })).toBeTruthy();
  });

  it('shows every choice at once, rather than hiding them behind a menu', async () => {
    const drawn = await render(
      <SegmentedRow label="Library" items={MORE_THAN_FIT} value="films" onSelect={jest.fn()} />,
    );

    expect(drawn.getByText('Films')).toBeTruthy();
    expect(drawn.getByText('Shows')).toBeTruthy();
  });

  it('says which one is picked, so it is not only a colour', async () => {
    const drawn = await render(
      <SegmentedRow label="Library" items={MORE_THAN_FIT} value="films" onSelect={jest.fn()} />,
    );

    expect(drawn.getByRole('button', { name: 'Films', selected: true })).toBeTruthy();
    expect(drawn.getByRole('button', { name: 'Shows', selected: false })).toBeTruthy();
  });

  it('says which one they picked', async () => {
    const onSelect = jest.fn();
    const drawn = await render(
      <SegmentedRow label="Library" items={MORE_THAN_FIT} value="films" onSelect={onSelect} />,
    );

    await userEvent.press(drawn.getByLabelText('Shows'));

    expect(onSelect).toHaveBeenCalledWith('shows');
  });

  it('picks nothing where nothing has been picked yet', async () => {
    const drawn = await render(
      <SegmentedRow label="Library" items={MORE_THAN_FIT} value={null} onSelect={jest.fn()} />,
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
