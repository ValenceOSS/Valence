import { BucketChangeSchema, StoredBucketsSchema } from '@ValenceContracts/schemas/Bucket';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { bucketIdFor } from '@ValenceServer/buckets/bucketIdFor';
import { asTheServer } from '@ValenceServer/visibility/asTheServer';
import type { StoredBucket } from '@ValenceContracts/schemas/Bucket';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers the S3-compatible buckets an administrator adds, each mounted as a folder a library can
 * be pointed at: listing them with how their mounts are doing, adding, changing and removing one,
 * and trying one before it is saved.
 *
 * A bucket's secret is never sent back once saved, and a change that leaves it empty keeps it. A
 * bucket a library still reads from cannot be removed, since the library would be left reading an
 * empty folder.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveBuckets = (app: OpenAPIHono, context: AppContext): void => {
  const { requires, settings, buckets, library } = context;

  const saved = async () => StoredBucketsSchema.catch([]).parse((await settings.read()).buckets);

  const listed = async () => ({
    canMount: await buckets.canMount(),
    buckets: (await saved()).map(({ secretAccessKey: _secret, ...bucket }) => ({
      ...bucket,
      path: buckets.pathOf(bucket.id),
      status: buckets.stateOf(bucket.id),
    })),
  });

  const keep = async (next: StoredBucket[]) => {
    await settings.write({ buckets: next });
    await buckets.apply(next);
  };

  const readChange = async (request: Request) => {
    const body = JsonValueSchema.safeParse(await request.json().catch(() => null));

    return BucketChangeSchema.safeParse(body.success ? body.data : null);
  };

  app.get('/api/admin/buckets', async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    return context.json(await listed(), 200);
  });

  app.post('/api/admin/buckets', async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const asked = await readChange(context.req.raw);

    if (!asked.success || asked.data.secretAccessKey === '') {
      return context.json(refuse('error.buckets.thatBucketCouldNotBeRead'), 400);
    }

    const was = await saved();
    const id = bucketIdFor(asked.data.name, new Set(was.map((bucket) => bucket.id)));

    await keep([...was, { ...asked.data, id }]);

    return context.json(await listed(), 200);
  });

  app.put('/api/admin/buckets/:id', async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const id = context.req.param('id');
    const asked = await readChange(context.req.raw);
    const was = await saved();
    const held = was.find((bucket) => bucket.id === id);

    if (held === undefined) {
      return context.json(refuse('error.buckets.noSuchBucket'), 404);
    }

    if (!asked.success) {
      return context.json(refuse('error.buckets.thatBucketCouldNotBeRead'), 400);
    }

    await keep(
      was.map((bucket) =>
        bucket.id === id
          ? {
              ...asked.data,
              id,
              secretAccessKey: asked.data.secretAccessKey || held.secretAccessKey,
            }
          : bucket,
      ),
    );

    return context.json(await listed(), 200);
  });

  app.delete('/api/admin/buckets/:id', async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const id = context.req.param('id');
    const was = await saved();
    const path = buckets.pathOf(id);
    const isRead = (await library.list(asTheServer)).some(
      (shelf) => shelf.path === path || shelf.path.startsWith(`${path}/`),
    );

    if (!was.some((bucket) => bucket.id === id)) {
      return context.json(refuse('error.buckets.noSuchBucket'), 404);
    }

    if (isRead) {
      return context.json(refuse('error.buckets.aLibraryStillReadsFromIt'), 409);
    }

    await keep(was.filter((bucket) => bucket.id !== id));

    return context.json(await listed(), 200);
  });

  app.post('/api/admin/buckets/test', async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const asked = await readChange(context.req.raw);
    const held = (await saved()).find((bucket) => bucket.id === context.req.query('id'));

    if (!asked.success) {
      return context.json(refuse('error.buckets.thatBucketCouldNotBeRead'), 400);
    }

    const secretAccessKey = asked.data.secretAccessKey || held?.secretAccessKey || '';

    if (secretAccessKey === '') {
      return context.json(refuse('error.buckets.thatBucketCouldNotBeRead'), 400);
    }

    return context.json(
      await buckets.test({ ...asked.data, id: held?.id ?? 'test', secretAccessKey }),
      200,
    );
  });
};

export { serveBuckets };
