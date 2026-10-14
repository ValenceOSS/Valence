import { createElement } from 'react';
import { toast } from 'sonner';
import { NoticeCard } from '@ValenceUI/NoticeCard';
import type { NoticeTone } from '@ValenceUI/NoticeCard.types';

const SHOWN_FOR_MS = 5000;

type Notice = {
  description?: string;
  action?: { label: string; onPress: () => void };
  tags?: readonly string[];
  countdown?: boolean | { lead: string };
  id?: string;
  where?: string;
  staysUntilDismissed?: boolean;
};

/**
 * Shows a notice as Valence's own card rather than the library's, for as long as it should stay:
 * until dismissed where it asks to, or while work is under way, and otherwise a few seconds, which
 * a countdown on the card says out loud.
 *
 * @param tone - What kind of notice it is.
 * @param message - What happened.
 * @param notice - A second line, an action, tags, a countdown, or an identifier to update later.
 * @returns The identifier, for updating or dismissing it.
 */
const show = (tone: NoticeTone, message: string, notice: Notice | undefined): string | number => {
  const stays = notice?.staysUntilDismissed === true || tone === 'working';
  const countdown =
    notice?.countdown === undefined || notice.countdown === false || stays
      ? undefined
      : {
          seconds: SHOWN_FOR_MS / 1000,
          ...(notice.countdown === true ? {} : { lead: notice.countdown.lead }),
        };

  return toast.custom(
    (id) =>
      createElement(NoticeCard, {
        tone,
        title: message,
        ...(notice?.description === undefined ? {} : { description: notice.description }),
        ...(notice?.action === undefined ? {} : { action: notice.action }),
        ...(notice?.tags === undefined ? {} : { tags: notice.tags }),
        ...(countdown === undefined ? {} : { countdown }),
        onDismiss: () => {
          toast.dismiss(id);
        },
      }),
    {
      unstyled: true,
      duration: stays ? Number.POSITIVE_INFINITY : SHOWN_FOR_MS,
      ...(notice?.id === undefined ? {} : { id: notice.id }),
      ...(notice?.where === undefined ? {} : { toasterId: notice.where }),
    },
  );
};

/**
 * Tells the viewer something that happened, with no verdict attached.
 *
 * @param message - What happened.
 * @param notice - A second line, an action, tags, a countdown, or an identifier to update later.
 * @returns The identifier, for updating or dismissing it.
 */
const say = (message: string, notice?: Notice): string | number => show('info', message, notice);

/**
 * Tells the viewer that what they asked for worked.
 *
 * @param message - What worked.
 * @param notice - A second line, an action, tags, a countdown, or an identifier to update later.
 * @returns The identifier, for updating or dismissing it.
 */
const worked = (message: string, notice?: Notice): string | number =>
  show('worked', message, notice);

/**
 * Tells the viewer that what they asked for did not work, which is the case worth being clearest
 * about — an error nobody surfaces is an application that appears to have ignored them.
 *
 * @param message - What went wrong, in the viewer's terms rather than the server's.
 * @param notice - A second line, an action, tags, a countdown, or an identifier to update later.
 * @returns The identifier, for updating or dismissing it.
 */
const failed = (message: string, notice?: Notice): string | number =>
  show('failed', message, notice);

/**
 * Tells the viewer something is under way and will finish on its own.
 *
 * @param message - What is happening.
 * @param notice - A second line, an action, tags, a countdown, or an identifier to update later.
 * @returns The identifier, which the caller passes back to say how it went.
 */
const working = (message: string, notice?: Notice): string | number =>
  show('working', message, notice);

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
