import { sayCount } from '@ValenceI18n/sayCount';
import { say } from '@ValenceI18n/say';
import {
  cancelUploadRoute,
  finishUploadRoute,
  startUploadRoute,
  uploadMediaRoute,
  uploadPieceRoute,
  uploadStatusRoute,
} from '@ValenceServer/routes/UploadRoute';
import { planUpload } from '@ValenceServer/uploads/planUpload';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';

/**
 * Registers the upload endpoints.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveUpload = (app: OpenAPIHono, context: AppContext): void => {
  const { uploadDisk, uploadSessions, libraryToUploadInto, sayRefused, sweepAbandonedUploads } =
    context;

  app.openapi(uploadMediaRoute, async (context) => {
    const found = await libraryToUploadInto(context.req.raw.headers, context.req.valid('param').id);

    if (found.kind === 'forbidden') {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    if (found.kind === 'signedOut') {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    if (found.kind === 'missing') {
      return context.json({ error: say('server.errors.noSuchLibrary') }, 404);
    }

    const relativePath = context.req.valid('query').path;
    const plan = planUpload(found.target.path, relativePath, found.target.kind);

    if (plan.kind === 'badPath') {
      return context.json({ error: say('server.errors.uploadPathPlain') }, 400);
    }

    if (plan.kind === 'refused') {
      return context.json({ error: say('server.errors.notReadByLibrary') }, 415);
    }

    const body = context.req.raw.body;

    if (body === null) {
      return context.json({ error: say('server.errors.noFileSent') }, 400);
    }

    const written = await uploadDisk.write(plan.destination, body);

    if (written.kind === 'written') {
      return context.json({ path: relativePath, bytes: written.bytes }, 201);
    }

    if (written.kind === 'exists') {
      return context.json({ error: say('server.errors.fileAlreadyThere') }, 409);
    }

    const said = sayRefused(written);

    return context.json({ error: said.error }, said.status);
  });

  app.openapi(startUploadRoute, async (context) => {
    await sweepAbandonedUploads();

    const found = await libraryToUploadInto(context.req.raw.headers, context.req.valid('param').id);

    if (found.kind === 'forbidden') {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    if (found.kind === 'signedOut') {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    if (found.kind === 'missing') {
      return context.json({ error: say('server.errors.noSuchLibrary') }, 404);
    }

    const { path: relativePath, bytes } = context.req.valid('query');
    const plan = planUpload(found.target.path, relativePath, found.target.kind);

    if (plan.kind === 'badPath') {
      return context.json({ error: say('server.errors.uploadPathPlain') }, 400);
    }

    if (plan.kind === 'refused') {
      return context.json({ error: say('server.errors.notReadByLibrary') }, 415);
    }

    const session = await uploadSessions.open({
      libraryId: found.target.id,
      path: relativePath,
      destination: plan.destination,
      bytes,
    });
    const begun = await uploadDisk.begin(plan.destination, session.staging);

    if (begun.kind === 'begun') {
      return context.json(
        { uploadId: session.uploadId, pieceBytes: session.pieceBytes, pieces: session.pieces },
        201,
      );
    }

    await uploadSessions.close(session.uploadId);

    if (begun.kind === 'exists') {
      return context.json({ error: say('server.errors.fileAlreadyThere') }, 409);
    }

    const said = sayRefused(begun);

    return context.json({ error: said.error }, said.status);
  });

  app.openapi(uploadPieceRoute, async (context) => {
    const { id, uploadId, index } = context.req.valid('param');
    const found = await libraryToUploadInto(context.req.raw.headers, id);

    if (found.kind === 'forbidden') {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    if (found.kind === 'signedOut') {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const session = found.kind === 'found' ? await uploadSessions.find(uploadId, id) : null;

    if (session === null) {
      return context.json({ error: say('server.errors.noSuchUpload') }, 404);
    }

    const body = context.req.raw.body;

    if (index >= session.pieces || body === null) {
      return context.json({ error: say('server.errors.notAPieceOfUpload') }, 400);
    }

    const offset = index * session.pieceBytes;
    const expected = Math.min(session.pieceBytes, session.bytes - offset);
    const written = await uploadDisk.writeAt(session.staging, offset, body);

    if (written.kind !== 'written') {
      const said = sayRefused(written);

      return context.json({ error: said.error }, said.status);
    }

    if (written.bytes !== expected) {
      await uploadSessions.receive(uploadId, index, false);

      return context.json(
        {
          error: sayCount('server.errors.pieceWrongSize', written.bytes, {
            expected: expected.toLocaleString('en'),
          }),
        },
        400,
      );
    }

    const received = await uploadSessions.receive(uploadId, index, true);

    return context.json({ received: [...received], pieces: session.pieces }, 200);
  });

  app.openapi(uploadStatusRoute, async (context) => {
    const { id, uploadId } = context.req.valid('param');
    const found = await libraryToUploadInto(context.req.raw.headers, id);

    if (found.kind === 'forbidden') {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    if (found.kind === 'signedOut') {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const session = found.kind === 'found' ? await uploadSessions.find(uploadId, id) : null;

    if (session === null) {
      return context.json({ error: say('server.errors.noSuchUpload') }, 404);
    }

    return context.json({ received: [...session.received], pieces: session.pieces }, 200);
  });

  app.openapi(finishUploadRoute, async (context) => {
    const { id, uploadId } = context.req.valid('param');
    const found = await libraryToUploadInto(context.req.raw.headers, id);

    if (found.kind === 'forbidden') {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    if (found.kind === 'signedOut') {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const session = found.kind === 'found' ? await uploadSessions.find(uploadId, id) : null;

    if (session === null) {
      return context.json({ error: say('server.errors.noSuchUpload') }, 404);
    }

    if (session.received.length < session.pieces) {
      return context.json(
        {
          error: sayCount('server.errors.piecesMissing', session.pieces - session.received.length),
        },
        400,
      );
    }

    const finished = await uploadDisk.finish(session.staging, session.destination, session.bytes);

    await uploadSessions.close(uploadId);

    if (finished.kind === 'written') {
      return context.json({ path: session.path, bytes: finished.bytes }, 201);
    }

    await uploadDisk.discard(session.staging);

    if (finished.kind === 'exists') {
      return context.json({ error: say('server.errors.fileAlreadyThere') }, 409);
    }

    const said = sayRefused(finished);

    return context.json({ error: said.error }, said.status);
  });

  app.openapi(cancelUploadRoute, async (context) => {
    const { id, uploadId } = context.req.valid('param');
    const found = await libraryToUploadInto(context.req.raw.headers, id);

    if (found.kind === 'forbidden') {
      return context.json({ error: say('server.errors.forAdministrators') }, 403);
    }

    if (found.kind === 'signedOut') {
      return context.json({ error: say('server.errors.notSignedIn') }, 401);
    }

    const session = found.kind === 'found' ? await uploadSessions.find(uploadId, id) : null;

    if (session !== null) {
      await uploadSessions.close(uploadId);
      await uploadDisk.discard(session.staging);
    }

    return context.body(null, 204);
  });
};

export { serveUpload };
