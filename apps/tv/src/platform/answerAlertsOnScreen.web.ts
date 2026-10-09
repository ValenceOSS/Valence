import { Alert } from 'react-native';
import { askOnScreen } from '@ValenceTv/navigation/prompts';
import { say } from '@ValenceI18n/say';
import type { answerAlertsOnScreen as onTheTelevision } from '@ValenceTv/platform/answerAlertsOnScreen';

/**
 * Puts every alert on the screen for the remote to answer, in a television's browser.
 *
 * The browser build of React Native leaves an alert doing nothing at all, so asking whether to hide
 * a film, or to sign another device out, went unanswered and did nothing. Here each one becomes a
 * question drawn over the page, with its answers as buttons, and one with no answers of its own is
 * given a single OK.
 */
const answerAlertsOnScreen: typeof onTheTelevision = () => {
  Alert.alert = (title, message, buttons) => {
    askOnScreen({
      title,
      ...(message === undefined ? {} : { message }),
      buttons:
        buttons === undefined || buttons.length === 0
          ? [{ text: say('tv.prompt.ok'), style: 'cancel' }]
          : buttons.map((button) => ({
              text: button.text ?? say('tv.prompt.ok'),
              ...(button.style === undefined ? {} : { style: button.style }),
              ...(button.onPress === undefined
                ? {}
                : {
                    onPress: () => {
                      button.onPress?.();
                    },
                  }),
            })),
    });
  };
};

export { answerAlertsOnScreen };
