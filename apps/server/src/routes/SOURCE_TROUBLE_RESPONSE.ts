/* oxlint-disable valence/no-hard-coded-strings -- the API reference is written for developers, in English, like every route's own descriptions */
import { RefusalSchema } from '@ValenceContracts/schemas/Refusal';

const SOURCE_TROUBLE_RESPONSE = {
  503: {
    description:
      'Nothing was found because a site it asks could not answer: rate limited, refused, failing or unreachable',
    content: { 'application/json': { schema: RefusalSchema.openapi('SourceTrouble') } },
  },
};

export { SOURCE_TROUBLE_RESPONSE };
