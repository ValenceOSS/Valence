import {
  choosePreRollRoute,
  preRollClipRoute,
  readPreRollSetupRoute,
  savePreRollSetupRoute,
} from '@ValenceServer/routes/PreRollRoute';
import { doesPreRollPlayBefore } from '@ValenceServer/preRoll/doesPreRollPlayBefore';
import { listPreRollClips } from '@ValenceServer/preRoll/listPreRollClips';
import { readMediaFile } from '@ValenceServer/playback/readMediaFile';
import { isAbsolute } from 'node:path';
import type { AppContext } from '@ValenceServer/api/AppContext';
import type { OpenAPIHono } from '@hono/zod-openapi';
import type { PreRollSetup } from '@ValenceContracts/schemas/PreRoll';
import type { PreRollSettings } from '@ValenceContracts/schemas/PreRollSettings';
import { refuse } from '@ValenceI18n/refuse';

/**
 * Says how pre-roll is set up, with the clips its folder holds now.
 *
 * @param settings - The pre-roll settings.
 * @returns The setup.
 */
const describeSetup = async (settings: PreRollSettings): Promise<PreRollSetup> => {
  const clips = await listPreRollClips(settings.folder);

  return {
    ...settings,
    clips: (clips ?? []).map(({ id, name }) => ({ id, name })),
    isFolderReadable: settings.folder.trim() === '' || clips !== null,
  };
};

/**
 * Registers the pre-roll endpoints: the administrators' settings, the choice of a clip before a
 * film or episode, and the clip itself.
 *
 * @param app - The application to register them on.
 * @param context - What they are answered with.
 */
const servePreRoll = (app: OpenAPIHono, context: AppContext): void => {
  const { settings, library, requires, forwardedFileHeaders } = context;

  app.openapi(readPreRollSetupRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    return context.json(await describeSetup((await settings.read()).preRoll), 200);
  });

  app.openapi(savePreRollSetupRoute, async (context) => {
    if (!(await requires(context.req.raw.headers, 'server.settings'))) {
      return context.json(refuse('common.thatIsForAdministrators'), 403);
    }

    const change = context.req.valid('json');
    const folder = change.folder.trim();

    if (folder !== '' && !isAbsolute(folder)) {
      return context.json(refuse('error.folder.giveTheWholePathStartingFrom'), 400);
    }

    const saved = await settings.write({ preRoll: { ...change, folder } });

    return context.json(await describeSetup(saved.preRoll), 200);
  });

  app.openapi(choosePreRollRoute, async (context) => {
    const { mediaId } = context.req.valid('param');
    const item = await library.getMedia(mediaId);

    if (item === null) {
      return context.json(refuse('error.common.noSuchMediaItem'), 404);
    }

    const { preRoll } = await settings.read();
    const isEpisode =
      item.metadata.episodeNumber !== undefined && item.metadata.episodeNumber !== null;

    if (!doesPreRollPlayBefore(preRoll, isEpisode)) {
      return context.json({ clip: null }, 200);
    }

    const clips = (await listPreRollClips(preRoll.folder)) ?? [];
    const chosen = clips[Math.floor(Math.random() * clips.length)];

    return context.json(
      {
        clip:
          chosen === undefined ? null : { id: chosen.id, address: `/api/pre-roll/${chosen.id}` },
      },
      200,
    );
  });

  app.openapi(preRollClipRoute, async (context) => {
    const { clipId } = context.req.valid('param');
    const { preRoll } = await settings.read();
    const clip = ((await listPreRollClips(preRoll.folder)) ?? []).find(
      (each) => each.id === clipId,
    );
    const file =
      clip === undefined
        ? null
        : await readMediaFile(clip.path, context.req.header('range') ?? null);

    if (file === null) {
      return context.json(refuse('error.preRoll.noSuchClip'), 404);
    }

    return context.body(file.body, file.status === 206 ? 206 : 200, forwardedFileHeaders(file));
  });
};

export { servePreRoll };
