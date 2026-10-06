import { requireOptionalNativeModule } from 'expo';
import { ActionSheetIOS, Platform } from 'react-native';

type ActionSheet = {
  options: string[];
  title?: string;
  message?: string;
  cancelButtonIndex?: number;
  destructiveButtonIndex?: number;
  disabledButtonIndices?: number[];
};

type Choices = {
  ask: (
    title: string | null,
    message: string | null,
    options: string[],
    cancel: number | null,
    destructive: number | null,
    disabled: number[],
  ) => Promise<number | null>;
};

/**
 * Asks for one of several choices the way the phone asks: the system's action sheet on an iPhone,
 * and the system's list dialog on Android, which has no action sheet and whose alerts hold no more
 * than three buttons.
 *
 * @param sheet - The choices, and which one cancels, deletes, or cannot be picked.
 * @param onPicked - Told the position of the choice picked, or of the cancel choice where the sheet
 *   was dismissed.
 */
const showActionSheet = (sheet: ActionSheet, onPicked: (index: number) => void): void => {
  if (Platform.OS === 'ios') {
    ActionSheetIOS.showActionSheetWithOptions(sheet, onPicked);

    return;
  }

  const choices = requireOptionalNativeModule<Choices>('ValenceChoices');

  if (choices === null) {
    return;
  }

  void choices
    .ask(
      sheet.title ?? null,
      sheet.message ?? null,
      sheet.options,
      sheet.cancelButtonIndex ?? null,
      sheet.destructiveButtonIndex ?? null,
      sheet.disabledButtonIndices ?? [],
    )
    .then((picked) => {
      onPicked(picked ?? sheet.cancelButtonIndex ?? -1);
    });
};

export type { ActionSheet };

export { showActionSheet };
