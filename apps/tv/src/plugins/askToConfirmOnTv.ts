import { Alert } from 'react-native';
import { say } from '@ValenceI18n/say';

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
      say('common.areYouSure'),
      question,
      [
        { text: say('common.cancel'), style: 'cancel', onPress: () => settle(false) },
        { text: say('common.continue'), onPress: () => settle(true) },
      ],
      { cancelable: true, onDismiss: () => settle(false) },
    );
  });

export { askToConfirmOnTv };
