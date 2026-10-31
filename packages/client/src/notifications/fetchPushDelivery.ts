import { PushDeliverySchema } from '@ValenceContracts/schemas/Notification';
import type { PushDelivery } from '@ValenceContracts/schemas/Notification';

/**
 * Reads what a push woke this phone to say, which the push itself did not carry.
 *
 * @param deliveryId - The delivery the push named.
 * @returns What it says, or nothing where it is gone or was not for this phone.
 */
const fetchPushDelivery = async (deliveryId: string): Promise<PushDelivery | null> => {
  const answer = await fetch(
    `/api/notifications/deliveries/${encodeURIComponent(deliveryId)}`,
  ).catch(() => null);
  const read = PushDeliverySchema.safeParse(
    answer?.ok === true ? await answer.json().catch(() => null) : null,
  );

  return read.success ? read.data : null;
};

export { fetchPushDelivery };
