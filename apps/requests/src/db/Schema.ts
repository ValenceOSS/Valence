import { jsonb, pgSchema, text, timestamp } from 'drizzle-orm/pg-core';

const requestsSchema = pgSchema('valence_requests');

const setting = requestsSchema.table('setting', {
  key: text('key').primaryKey(),
  value: jsonb('value').notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export { requestsSchema, setting };
