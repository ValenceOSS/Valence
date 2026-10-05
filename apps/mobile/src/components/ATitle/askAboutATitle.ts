import { ActionSheetIOS } from 'react-native';
import { say } from '@ValenceI18n/say';

/**
 * Offers what else can be done with a title in the system's action sheet, as the web offers it in
 * the menu beside Play, and does the one picked.
 *
 * @param title - What the title is called, heading the sheet.
 * @param actions - What can be done, each with what it is called and what doing it means.
 */
const askAboutATitle = (
  title: string,
  actions: readonly { label: string; onChoose: () => void }[],
): void => {
  ActionSheetIOS.showActionSheetWithOptions(
    {
      title,
      options: [...actions.map((one) => one.label), say('common.cancel')],
      cancelButtonIndex: actions.length,
    },
    (picked) => {
      actions[picked]?.onChoose();
    },
  );
};

export { askAboutATitle };
