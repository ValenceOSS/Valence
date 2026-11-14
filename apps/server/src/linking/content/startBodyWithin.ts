import { z } from 'zod';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { QualityStepIdSchema } from '@ValenceContracts/schemas/QualityStep';
import type { QualityStepId } from '@ValenceContracts/schemas/QualityStep';
import { ceilingOf } from '@ValenceServer/linking/content/ceilingOf';

const AskedToStartSchema = z.object({}).catchall(JsonValueSchema);

/**
 * What a linked server asked to start, held to the quality its admin here allows it, a quality this
 * server does not know taken as above the ceiling, or nothing where the request is not a JSON
 * object — which is refused rather than passed on as sent, since what this server cannot read it
 * cannot hold to anything.
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

    if (!asked.success) {
      return null;
    }

    const requested = QualityStepIdSchema.safeParse(asked.data.requestedQuality);

    return new TextEncoder().encode(
      JSON.stringify({
        ...asked.data,
        requestedQuality: ceilingOf(requested.success ? requested.data : undefined, ceiling),
      }),
    ).buffer;
  } catch {
    return null;
  }
};

export { startBodyWithin };
