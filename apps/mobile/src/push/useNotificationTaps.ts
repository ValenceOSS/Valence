import { useEffect, useRef } from 'react';
import {
  addNotificationResponseReceivedListener,
  clearLastNotificationResponse,
  getLastNotificationResponse,
} from 'expo-notifications';
import type { NotificationResponse } from 'expo-notifications';
import { z } from 'zod';

const CarryingALinkSchema = z
  .object({ link: z.string().min(1).optional() })
  .nullish()
  .catch(null);

const TappedSchema = z.object({
  notification: z.object({
    request: z.object({
      identifier: z.string(),
      content: z.object({ data: CarryingALinkSchema }),
      trigger: z.object({ payload: CarryingALinkSchema }).nullish().catch(null),
    }),
  }),
});

const followed = new Set<string>();

/**
 * The link a tapped notification carries, where it carries one: in what the app put in it, or, for
 * a push from Valence's relay, among what the phone's notification service wrote into it once it had
 * read the notification's words from the server.
 *
 * @param response - What the phone said was tapped.
 * @returns Which notification it was and the link, or nothing where it cannot be read.
 */
const theTap = (response: NotificationResponse): { tapped: string; link: string | null } | null => {
  const read = TappedSchema.safeParse(response);

  if (!read.success) {
    return null;
  }

  const { identifier, content, trigger } = read.data.notification.request;

  return { tapped: identifier, link: content.data?.link ?? trigger?.payload?.link ?? null };
};

/**
 * Follows the notifications somebody taps — one tapped while the app is open, and the one that
 * opened it — to wherever each one's link leads, each once, forgetting it as soon as it is followed
 * so it is not followed again the next time somebody signs in.
 *
 * @param onLink - Told the link a tapped notification carries.
 */
const useNotificationTaps = (onLink: (link: string) => void): void => {
  const latest = useRef(onLink);

  useEffect(() => {
    latest.current = onLink;
  });

  useEffect(() => {
    const follow = (response: NotificationResponse | null) => {
      const tap = response === null ? null : theTap(response);

      if (tap === null || followed.has(tap.tapped)) {
        return;
      }

      followed.add(tap.tapped);
      clearLastNotificationResponse();

      if (tap.link !== null) {
        latest.current(tap.link);
      }
    };

    follow(getLastNotificationResponse());

    const listening = addNotificationResponseReceivedListener(follow);

    return () => {
      listening.remove();
    };
  }, []);
};

export { useNotificationTaps };
