import { useState } from 'react';
import { Provider } from 'react-redux';
import type { ReactNode } from 'react';
import { createDialogStore } from './createDialogStore';

/**
 * Holds the order of the open dialogs for everything beneath it, in a store of its own that starts
 * empty each time it is mounted.
 *
 * @param children - What may open a dialog.
 */
const DialogStackProvider = ({ children }: { children: ReactNode }) => {
  const [store] = useState(createDialogStore);

  return <Provider store={store}>{children}</Provider>;
};

DialogStackProvider.displayName = 'DialogStackProvider';

export { DialogStackProvider };
