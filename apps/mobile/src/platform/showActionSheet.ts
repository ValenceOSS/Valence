import { theSheetsAsked } from '@ValenceMobile/platform/theSheetsAsked';

type ActionSheet = {
  options: string[];
  title?: string;
  message?: string;
  cancelButtonIndex?: number;
  destructiveButtonIndex?: number;
  disabledButtonIndices?: number[];
};

/**
 * Asks for one of several choices in Valence's own sheet, the same on an iPhone and on Android, in
 * place of the system's action sheet and list dialog.
 *
 * @param sheet - The choices, and which one cancels, deletes, or cannot be picked.
 * @param onPicked - Told the position of the choice picked, or of the cancel choice where the sheet
 *   was put away.
 */
const showActionSheet = (sheet: ActionSheet, onPicked: (index: number) => void): void => {
  theSheetsAsked().ask(sheet, onPicked);
};

export type { ActionSheet };

export { showActionSheet };
