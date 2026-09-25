import { fireEvent, render, userEvent } from '@testing-library/react-native';
import { NumberedRow } from '@ValenceTv/components/NumberedRow/NumberedRow';

const aRow = (overrides: Partial<Parameters<typeof NumberedRow>[0]> = {}) => (
  <NumberedRow
    label="The Passage, 5 min"
    title="The Passage"
    length={300}
    place={2}
    isCurrent={false}
    isPlaying={false}
    onPress={jest.fn()}
    {...overrides}
  />
);

describe('NumberedRow', () => {
  it('says where it comes in the list, its name and how long it is', async () => {
    const drawn = await render(aRow({ detail: 'Pierce Brown', aside: 'Red Rising' }));

    expect(drawn.getByText('3')).toBeTruthy();
    expect(drawn.getByText('The Passage')).toBeTruthy();
    expect(drawn.getByText('Pierce Brown')).toBeTruthy();
    expect(drawn.getByText('Red Rising')).toBeTruthy();
    expect(drawn.getByText('5:00')).toBeTruthy();
  });

  it('shows bars in place of its number while it is the one playing', async () => {
    const drawn = await render(aRow({ isCurrent: true, isPlaying: true }));

    expect(drawn.queryByText('3')).toBeNull();
  });

  it('says where the chosen line and the line the remote is on come', async () => {
    const onPress = jest.fn();
    const onFocus = jest.fn();
    const drawn = await render(aRow({ onPress, onFocus }));

    await fireEvent(drawn.getByRole('button', { name: 'The Passage, 5 min' }), 'focus');
    await userEvent.press(drawn.getByRole('button', { name: 'The Passage, 5 min' }));

    expect(onFocus).toHaveBeenCalledWith(2);
    expect(onPress).toHaveBeenCalledWith(2);
  });
});
