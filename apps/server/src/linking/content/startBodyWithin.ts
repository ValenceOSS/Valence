import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { QualityStepIdSchema } from '@ValenceContracts/schemas/QualityStep';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';
import { ceilingOf } from '@ValenceServer/linking/content/ceilingOf';

const AskedToStartSchema = z
  .object({ requestedQuality: QualityStepIdSchema.optional() })
  .catchall(JsonValueSchema);

/**
 * What a linked server asked to start, held to the quality its admin here allows it, or nothing
 * where the request cannot be read — which is refused rather than passed on as sent, since what this
 * server cannot read it cannot hold to anything.
 *
 * @param sent - What the linked server sent.
 * @param ceiling - The best quality it may have.
 * @returns The request to start with instead, or nothing.
 */
const startBodyWithin = (sent: ArrayBuffer | null, ceiling: QualityStepId): ArrayBuffer | null => {
  if (sent === null) {
    return null;
  }

  try {
    const asked = AskedToStartSchema.safeParse(
      JsonValueSchema.parse(JSON.parse(new TextDecoder().decode(sent))),
    );

    return asked.success
      ? new TextEncoder().encode(
          JSON.stringify({
            ...asked.data,
            requestedQuality: ceilingOf(asked.data.requestedQuality, ceiling),
          }),
        ).buffer
      : null;
  } catch {
    return null;
  }
};

export { startBodyWithin };
