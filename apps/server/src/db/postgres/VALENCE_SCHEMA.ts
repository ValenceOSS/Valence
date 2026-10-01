import { authSchema, valenceSchema } from '@ValenceServer/db/postgres/Schema';

const VALENCE_SCHEMA = { ...authSchema, ...valenceSchema };

export { VALENCE_SCHEMA };
