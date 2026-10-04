import type { SERVER_FEATURES } from '@ValenceContracts/constants/SERVER_FEATURES';

type ServerFeature = (typeof SERVER_FEATURES)[number];

export type { ServerFeature };
