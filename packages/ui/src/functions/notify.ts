import { toast } from 'sonner';
import { cue } from '@ValenceUI/sounds/cue';

type Notice = {
  description?: string;
  action?: { label: string; onPress: () => void };
  id?: string;
  where?: string;
  staysUntilDismissed?: boolean;
};

/**
 * Turns a notice into the arguments Sonner wants, so that the shape callers use is Valence's rather
 * than the library's — `onPress` reads like every other control here, where `onClick` would be the
 * one place a handler was named after the mouse.
 *
 * @param notice - What the caller passed alongside the message.
 * @returns The options to hand to Sonner.
 */
const asOptions = (notice: Notice | undefined) => ({
  ...(notice?.description === undefined ? {} : { description: notice.description }),
  ...(notice?.id === undefined ? {} : { id: notice.id }),
  ...(notice?.where === undefined ? {} : { toasterId: notice.where }),
  ...(notice?.staysUntilDismissed === true ? { duration: Number.POSITIVE_INFINITY } : {}),
  ...(notice?.action === undefined
    ? {}
    : { action: { label: notice.action.label, onClick: notice.action.onPress } }),
});

/**
 * Tells the viewer something that happened, with no verdict attached, heard as a quiet note where
 * sounds are on and the message is new rather than an update to one already showing.
 *
 * @param message - What happened.
 * @param notice - A second line, an action, or an identifier to update later.
 * @returns The identifier, for updating or dismissing it.
 */
const say = (message: string, notice?: Notice): string | number => {
  if (notice?.id === undefined) {
    cue('ready', { emphasis: 'subtle' });
  }

  return toast(message, asOptions(notice));
};

/**
 * Tells the viewer that what they asked for worked, heard as success where sounds are on.
 *
 * @param message - What worked.
 * @param notice - A second line, an action, or an identifier to update later.
 * @returns The identifier, for updating or dismissing it.
 */
const worked = (message: string, notice?: Notice): string | number => {
  cue('success');

  return toast.success(message, asOptions(notice));
};

/**
 * Tells the viewer that what they asked for did not work, which is the case worth being clearest
 * about — an error nobody surfaces is an application that appears to have ignored them. Heard as an
 * error where sounds are on.
 *
 * @param message - What went wrong, in the viewer's terms rather than the server's.
 * @param notice - A second line, an action, or an identifier to update later.
 * @returns The identifier, for updating or dismissing it.
 */
const failed = (message: string, notice?: Notice): string | number => {
  cue('error');

  return toast.error(message, asOptions(notice));
};

/**
 * Tells the viewer something is under way and will finish on its own, heard beginning where sounds
 * are on and it is new rather than an update.
 *
 * @param message - What is happening.
 * @param notice - A second line, an action, or an identifier to update later.
 * @returns The identifier, which the caller passes back to say how it went.
 */
const working = (message: string, notice?: Notice): string | number => {
  if (notice?.id === undefined) {
    cue('loading', { emphasis: 'subtle' });
  }

  return toast.loading(message, asOptions(notice));
};

/**
 * Takes a message back, for something that stopped mattering before the viewer read it.
 *
 * @param id - Which message, or every one where none is named.
 */
const forget = (id?: string | number): void => {
  toast.dismiss(id);
};

const notify = { say, worked, failed, working, forget };

export type { Notice };

export { notify };
