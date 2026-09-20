import { useState } from 'react';

/**
 * Keeps what a dialog last showed while it is leaving, because a caller that clears its own state
 * the moment it closes would otherwise empty the panel before the exit animation had finished with it.
 *
 * @param content - What the dialog is showing now, or would show if it were open.
 * @param isOpen - Whether the dialog is showing.
 * @returns The content as it was when the dialog last was open, once it has been closed.
 */
const useHeldWhileClosing = <Content>(content: Content, isOpen: boolean): Content => {
  const [held, setHeld] = useState(content);

  if (isOpen && held !== content) {
    setHeld(content);
  }

  return isOpen ? content : held;
};

export { useHeldWhileClosing };
