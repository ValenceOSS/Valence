import type { PushDelivery } from '@ValenceContracts/schemas/Notification';
import type { NotificationRecipient } from './NotificationStore';

const KEPT_FOR_MS = 60 * 60 * 1000;

/**
 * What each push woke a phone to say, held for an hour so the phone can ask for it, and only by
 * whoever it was meant for: the relay that woke the phone carries nothing but the delivery's
 * identifier, so this is the one place the words are. Held in memory, since a push nobody read
 * within the hour is not worth keeping across a restart.
 *
 * @param now - The clock.
 * @returns A way to keep a delivery, and to read one back as somebody.
 */
const createPushDeliveries = (now: () => number = Date.now) => {
  const held = new Map<
    string,
    { whose: NotificationRecipient; delivery: PushDelivery; until: number }
  >();

  return {
    keep: (deliveryId: string, whose: NotificationRecipient, delivery: PushDelivery): void => {
      const at = now();

      for (const [id, entry] of held) {
        if (entry.until <= at) {
          held.delete(id);
        }
      }

      held.set(deliveryId, { whose, delivery, until: at + KEPT_FOR_MS });
    },

    read: (deliveryId: string, asking: NotificationRecipient): PushDelivery | null => {
      const entry = held.get(deliveryId);

      if (
        entry === undefined ||
        entry.until <= now() ||
        entry.whose.userId !== asking.userId ||
        (entry.whose.profileId !== null && entry.whose.profileId !== asking.profileId)
      ) {
        return null;
      }

      return entry.delivery;
    },
  };
};

type PushDeliveries = ReturnType<typeof createPushDeliveries>;

export type { PushDeliveries };

export { createPushDeliveries };
