import { Provider } from 'react-redux';
import type { ReactNode } from 'react';
import { dialogStore } from './dialogStore';

/**
 * Holds the order of the open dialogs for everything beneath it.
 *
 * @param children - What may open a dialog.
 */
const DialogStackProvider = ({ children }: { children: ReactNode }) => (
  <Provider store={dialogStore}>{children}</Provider>
);

DialogStackProvider.displayName = 'DialogStackProvider';

export { DialogStackProvider };
