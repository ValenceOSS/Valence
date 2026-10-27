import { render, userEvent } from '@testing-library/react-native';
import { ASheetChoice } from './ASheetChoice';

describe('ASheetChoice', () => {
  it('says what it is and what it means', async () => {
    const drawn = await render(
      <ASheetChoice
        label="Each song"
        detail="Every song at one loudness"
        isChosen={false}
        onPress={jest.fn()}
      />,
    );

    expect(drawn.getByText('Each song')).toBeTruthy();
    expect(drawn.getByText('Every song at one loudness')).toBeTruthy();
  });

  it('is marked where it is the one chosen', async () => {
    const drawn = await render(<ASheetChoice label="Off" isChosen onPress={jest.fn()} />);

    expect(drawn.getByRole('button', { name: 'Off' })).toBeSelected();
  });

  it('says it was pressed', async () => {
    const onPress = jest.fn();
    const drawn = await render(
      <ASheetChoice label="6 seconds" isChosen={false} onPress={onPress} />,
    );

    await userEvent.press(drawn.getByRole('button', { name: '6 seconds' }));

    expect(onPress).toHaveBeenCalled();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(ASheetChoice.displayName).toBe('ASheetChoice');
  });
});
