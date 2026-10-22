import { SETTINGS_FOLD_WITHIN_MS } from '@ValenceServer/audit/SETTINGS_FOLD_WITHIN_MS';
import { BrandSettingsSchema, NO_BRAND } from '@ValenceContracts/schemas/Brand';
import { JsonValueSchema } from '@ValenceContracts/schemas/JsonValue';
import { BRAND_LOGO_LIMITS } from '@ValenceServer/brand/BRAND_LOGO_LIMITS';
import { describePictureFault } from '@ValenceServer/profiles/describePictureFault';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import { bodyOf } from '@ValenceI18n/bodyOf';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Registers the server's own name, accent, description and logo: what replaces Valence's in the apps
 * and the emails, set by an administrator and shown to everybody, signed in or not.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const serveBrand = (app: OpenAPIHono, context: AppContext): void => {
  const { requires, settings, brandLogo, tooBigToRead, recordAudit } = context;

  const brandNow = async () => ({
    ...BrandSettingsSchema.catch(NO_BRAND).parse((await settings.read()).brand),
    logo: await brandLogo.address(),
  });

  app.get('/api/brand/logo', async (context) => {
    const picture = await brandLogo.read();

    if (picture === null) {
      return context.json(refuse('error.brand.thisServerHasNoLogo'), 404);
    }

    const isVersioned = context.req.query('v') !== undefined;

    return context.body(picture.body.slice().buffer, 200, {
      'content-type': picture.contentType,
      'cache-control': isVersioned ? 'public, max-age=31536000, immutable' : 'public, max-age=60',
    });
  });

  app.put('/api/admin/brand', async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const body = JsonValueSchema.safeParse(await context.req.json().catch(() => null));
    const brand = BrandSettingsSchema.safeParse(body.success ? body.data : null);

    if (!brand.success) {
      return context.json(refuse('error.brand.thatBrandCouldNotBeRead'), 400);
    }

    await settings.write({ brand: brand.data });
    await recordAudit(
      context,
      'settings.changed',
      null,
      { settings: 'brand' },
      { foldWithinMs: SETTINGS_FOLD_WITHIN_MS },
    );

    return context.json({ brand: await brandNow() }, 200);
  });

  app.put('/api/admin/brand/logo', tooBigToRead(BRAND_LOGO_LIMITS), async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const wrong = await brandLogo.save({
      body: new Uint8Array(await context.req.arrayBuffer()),
      contentType: context.req.header('content-type') ?? '',
    });

    if (wrong !== null) {
      const said = describePictureFault(wrong, BRAND_LOGO_LIMITS);

      return context.json(bodyOf(said), said.status);
    }

    await recordAudit(
      context,
      'settings.changed',
      null,
      { settings: 'logo' },
      { foldWithinMs: SETTINGS_FOLD_WITHIN_MS },
    );

    return context.json({ brand: await brandNow() }, 200);
  });

  app.delete('/api/admin/brand/logo', async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    await brandLogo.remove();
    await recordAudit(
      context,
      'settings.changed',
      null,
      { settings: 'logo' },
      { foldWithinMs: SETTINGS_FOLD_WITHIN_MS },
    );

    return context.json({ brand: await brandNow() }, 200);
  });
};

export { serveBrand };
