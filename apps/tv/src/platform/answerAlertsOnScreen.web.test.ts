import { Alert } from 'react-native';
import { answerAlertsOnScreen } from '@ValenceTv/platform/answerAlertsOnScreen';
import { putThePromptAway, whenPrompted } from '@ValenceTv/navigation/prompts';
import type { Prompt } from '@ValenceTv/navigation/prompts';

describe('answerAlertsOnScreen in a browser', () => {
  afterEach(() => {
    putThePromptAway();
  });

  it('puts an alert on the screen with its answers', () => {
    let shown: Prompt | null = null;
    const hide = jest.fn();

    answerAlertsOnScreen();
    whenPrompted((prompt) => {
      shown = prompt;
    });
    Alert.alert('Hide this film?', 'It leaves every shelf.', [
      { text: 'Keep it', style: 'cancel' },
      { text: 'Hide it', style: 'destructive', onPress: hide },
    ]);

    expect(shown).toEqual(
      expect.objectContaining({ title: 'Hide this film?', message: 'It leaves every shelf.' }),
    );
  });

  it('gives an alert with no answers of its own a single OK', () => {
    let shown: Prompt | null = null;

    answerAlertsOnScreen();
    whenPrompted((prompt) => {
      shown = prompt;
    });
    Alert.alert('That device could not be signed out.');

    expect(shown).toEqual(expect.objectContaining({ buttons: [{ text: 'OK', style: 'cancel' }] }));
  });
});
