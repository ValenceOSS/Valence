import { aRuleTester } from './aRuleTester';
import { neutralQueries } from './neutralQueries';

const ruleTester = aRuleTester();

ruleTester.run('neutral-queries', neutralQueries, {
  valid: [
    { code: "import { eq, like } from 'drizzle-orm';" },
    { code: "import { ilike } from 'somewhere-else';" },
    { code: 'await upsert(db, TITLES, { values, target, set });' },
    { code: 'await db.insert(TITLES).values(row);' },
    { code: 'const it = sql`lower(${column}) like lower(${pattern})`;' },
    { code: 'const it = sql<number>`coalesce(sum(case when ${condition} then 1 else 0 end), 0)`;' },
    { code: "const it = sql.raw('asc');" },
    { code: "const it = 'a || b';" },
    { code: 'const it = other`a::b`;' },
  ],
  invalid: [
    { code: 'await db.delete(TITLES).returning();', errors: [{ messageId: 'method' }] },
    {
      code: 'await db.insert(TITLES).values(row).onConflictDoNothing();',
      errors: [{ messageId: 'method' }],
    },
    {
      code: 'await db.insert(TITLES).values(row).onConflictDoUpdate({ target, set });',
      errors: [{ messageId: 'method' }],
    },
    {
      code: 'await db.selectDistinctOn([TITLES.id]).from(TITLES);',
      errors: [{ messageId: 'method' }],
    },
    { code: "import { eq, ilike } from 'drizzle-orm';", errors: [{ messageId: 'ilike' }] },
    { code: 'const it = sql`${value}::jsonb`;', errors: [{ messageId: 'raw' }] },
    { code: 'const it = sql<string>`${a} || ${b}`;', errors: [{ messageId: 'raw' }] },
    { code: 'const it = sql`${column} desc nulls last`;', errors: [{ messageId: 'raw' }] },
    {
      code: 'const it = sql`count(*) filter (where ${condition})`;',
      errors: [{ messageId: 'raw' }],
    },
    { code: 'const it = sql`select "title_id" from titles`;', errors: [{ messageId: 'raw' }] },
    { code: "const it = sql.raw('x::text');", errors: [{ messageId: 'raw' }] },
  ],
});
