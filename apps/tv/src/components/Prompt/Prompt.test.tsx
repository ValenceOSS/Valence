import { render, userEvent } from '@testing-library/react-native';
import { Prompt } from '@ValenceTv/components/Prompt/Prompt';

describe('Prompt', () => {
  it('asks its question, and does what the chosen answer says once it is put away', async () => {
    const onAnswered = jest.fn();
    const hide = jest.fn();
    const drawn = await render(
      <Prompt
        prompt={{
          title: 'Hide this film?',
          message: 'It leaves every shelf.',
          buttons: [
            { text: 'Keep it', style: 'cancel' },
            { text: 'Hide it', style: 'destructive', onPress: hide },
          ],
        }}
        onAnswered={onAnswered}
      />,
    );

    expect(drawn.getByText('Hide this film?')).toBeTruthy();
    expect(drawn.getByText('It leaves every shelf.')).toBeTruthy();

    await userEvent.press(drawn.getByRole('button', { name: 'Hide it' }));

    expect(onAnswered).toHaveBeenCalledTimes(1);
    expect(hide).toHaveBeenCalledTimes(1);
  });

  it('sets a display name so devtools can identify it', () => {
    expect(Prompt.displayName).toBe('Prompt');
  });
});
