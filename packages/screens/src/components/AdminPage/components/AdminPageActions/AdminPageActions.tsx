import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { ADMIN_PAGE_ACTIONS } from '@ValenceScreens/components/AdminPage/ADMIN_PAGE_ACTIONS';
import type { AdminPageActionsProps } from './AdminPageActions.types';

/**
 * Puts a page's own actions in the bar along the top of the admin area, beside the page's title,
 * from wherever in the page they are written, so the thing a page is for is always in the same
 * place.
 *
 * @param children - The actions.
 */
const AdminPageActions = ({ children }: AdminPageActionsProps) => {
  const [slot, setSlot] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setSlot(document.getElementById(ADMIN_PAGE_ACTIONS));
  }, []);

  return slot === null ? null : createPortal(children, slot);
};

AdminPageActions.displayName = 'AdminPageActions';

export { AdminPageActions };
