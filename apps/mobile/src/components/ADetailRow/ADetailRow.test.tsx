import { ChevronsUpDown } from '@keyline-icons/react-native';
import { render, userEvent } from '@testing-library/react-native';
import { ADetailRow } from './ADetailRow';

describe('ADetailRow', () => {
  it('says what the fact is and what it says', async () => {
    const drawn = await render(<ADetailRow label="Budget" value="$25M" />);

    expect(drawn.getByText('Budget')).toBeTruthy();
    expect(drawn.getByText('$25M')).toBeTruthy();
  });

  it('can be pressed where it can be changed', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <ADetailRow label="Version" value="4K" icon={ChevronsUpDown} onPress={onPress} />,
    );

    await userEvent.press(drawn.getByLabelText('Version'));

    expect(onPress).toHaveBeenCalled();
  });

  it('is not a button where it cannot be changed', async () => {
    const drawn = await render(<ADetailRow label="Budget" value="$25M" />);

    expect(drawn.queryByRole('button')).toBeNull();
  });
});
