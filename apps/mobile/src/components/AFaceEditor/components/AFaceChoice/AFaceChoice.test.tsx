import { fireEvent, render, screen } from '@testing-library/react-native';
import { Text } from 'react-native';
import { AFaceChoice } from './AFaceChoice';

describe('AFaceChoice', () => {
  it('shows what it makes and its name, and says when it is chosen', async () => {
    const onChoose = jest.fn();

    await render(
      <AFaceChoice label="Draw it in Thumbs" name="Thumbs" isChosen onChoose={onChoose}>
        <Text>face</Text>
      </AFaceChoice>,
    );

    await fireEvent.press(screen.getByRole('button', { name: 'Draw it in Thumbs' }));

    expect(screen.getByText('face')).toBeTruthy();
    expect(screen.getByText('Thumbs')).toBeTruthy();
    expect(onChoose).toHaveBeenCalled();
  });

  it('shows an empty circle while it cannot be chosen', async () => {
    await render(
      <AFaceChoice label="Noir" name="Noir" isChosen={false} isDisabled onChoose={jest.fn()}>
        <Text>face</Text>
      </AFaceChoice>,
    );

    expect(screen.queryByText('face')).toBeNull();
  });

  it('sets a display name so devtools can identify it', () => {
    expect(AFaceChoice.displayName).toBe('AFaceChoice');
  });
});
