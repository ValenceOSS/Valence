import { Alert } from 'react-native';

/**
 * Asks somebody to confirm a press a plugin marked as needing it, in the television's own alert,
 * with the plugin's words shown as plain words.
 *
 * @param question - What the plugin asked to be confirmed.
 * @returns Whether they went ahead.
 */
const askToConfirmOnTv = (question: string): Promise<boolean> =>
  new Promise((settle) => {
    Alert.alert(
      'Are you sure?',
      question,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => settle(false) },
        { text: 'Continue', onPress: () => settle(true) },
      ],
      { cancelable: true, onDismiss: () => settle(false) },
    );
  });

export { askToConfirmOnTv };
