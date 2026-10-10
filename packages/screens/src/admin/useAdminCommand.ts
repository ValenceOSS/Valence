import { useEffect, useRef } from 'react';
import {
  listenForAdminCommands,
  takeAdminCommand,
} from '@ValenceScreens/admin/pendingAdminCommand';
import type { AdminCommandId } from '@ValenceScreens/components/AdminArea/adminCommands';

/**
 * Lets the command palette carry out one of a page's actions: when the page opens because the action
 * was chosen, or when it is chosen while the page is showing.
 *
 * @param id - The action.
 * @param run - What carrying it out does, such as opening the dialog its button opens.
 */
const useAdminCommand = (id: AdminCommandId, run: () => void): void => {
  const latest = useRef(run);

  useEffect(() => {
    latest.current = run;
  });

  useEffect(() => {
    const answer = () => {
      if (takeAdminCommand(id)) {
        latest.current();
      }
    };

    answer();

    return listenForAdminCommands(answer);
  }, [id]);
};

export { useAdminCommand };
