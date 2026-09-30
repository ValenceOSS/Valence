import { authSchema, valenceSchema } from '@ValenceServer/db/mysql/Schema';

const VALENCE_SCHEMA = { ...authSchema, ...valenceSchema };

export { VALENCE_SCHEMA };
