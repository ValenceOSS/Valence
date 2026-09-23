import { createElement as mockCreateElement } from 'react';
import { View as mockView } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { ASegmentedControl } from './ASegmentedControl';

jest.mock('expo', () => ({
  ...jest.requireActual<object>('expo'),
  requireNativeView: (name: string) => (props: object) =>
    mockCreateElement(mockView, { ...props, testID: name }),
}));

const SIDES = [
  { id: 'discover', label: 'Discover' },
  { id: 'asked', label: 'Requested' },
];

describe('ASegmentedControl', () => {
  it('hands the system control its choices and which is picked', async () => {
    const drawn = await render(
      <ASegmentedControl label="What to show" items={SIDES} value="asked" onSelect={jest.fn()} />,
    );

    expect(drawn.getByTestId('ValenceSegmentedControl')).toHaveProp('labels', [
      'Discover',
      'Requested',
    ]);
    expect(drawn.getByTestId('ValenceSegmentedControl')).toHaveProp('picked', 1);
    expect(drawn.getByLabelText('What to show')).toBeTruthy();
  });

  it('says which somebody picked', async () => {
    const onSelect = jest.fn();
    const drawn = await render(
      <ASegmentedControl label="What to show" items={SIDES} value="discover" onSelect={onSelect} />,
    );

    await fireEvent(drawn.getByTestId('ValenceSegmentedControl'), 'choose', {
      nativeEvent: { index: 1 },
    });

    expect(onSelect).toHaveBeenCalledWith('asked');
  });

  it('says nothing for the one already picked, or for no choice at all', async () => {
    const onSelect = jest.fn();
    const drawn = await render(
      <ASegmentedControl label="What to show" items={SIDES} value="discover" onSelect={onSelect} />,
    );

    await fireEvent(drawn.getByTestId('ValenceSegmentedControl'), 'choose', {
      nativeEvent: { index: 0 },
    });
    await fireEvent(drawn.getByTestId('ValenceSegmentedControl'), 'choose', {
      nativeEvent: { index: -1 },
    });

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('picks nothing where nothing has been picked yet', async () => {
    const drawn = await render(
      <ASegmentedControl label="What to show" items={SIDES} value={null} onSelect={jest.fn()} />,
    );

    expect(drawn.getByTestId('ValenceSegmentedControl')).toHaveProp('picked', -1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ASegmentedControl.displayName).toBe('ASegmentedControl');
  });
});
