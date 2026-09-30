import { sayVerbatim } from '@ValenceI18n/sayVerbatim';
import type { Said } from '@ValenceI18n/SaidSchema';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';
import type { PluginManifest } from '@ValenceSDK/manifest/PluginManifestSchema';
import type { ImageRef } from '@ValenceSDK/surface/ImageRefSchema';
import type { Surface } from '@ValenceSDK/surface/SurfaceSchema';
import type { SurfaceBlock } from '@ValenceSDK/surface/SurfaceBlockSchema';
import { serviceNotice } from './serviceNotice';
import { say } from '@ValenceI18n/say';
import { saying } from '@ValenceI18n/saying';

const NOT_SHOWN = serviceNotice(
  say('server.surfaces.cleanSurface.thisCouldNotBeShown'),
  say('server.surfaces.cleanSurface.thePluginSentSomethingValenceDoes'),
);

/**
 * Checks a surface a plugin sent before any client sees it: that it is made only of Valence's own
 * blocks within their limits, and that every picture it points at is one of the plugin's own or
 * comes from a host the plugin is allowed to reach — anything else is dropped rather than drawn.
 * A surface that does not read at all is replaced by a notice written by Valence.
 *
 * @param text - What the plugin answered, as JSON.
 * @param manifest - The plugin's manifest, for its hosts.
 * @param assets - The names of the pictures packed with the plugin.
 * @returns The surface to send, and why it was refused where it was.
 */
const cleanSurface = (
  text: string,
  manifest: PluginManifest,
  assets: ReadonlySet<string>,
): { surface: Surface; problem: Said | null } => {
  const hosts = new Set(
    manifest.permissions.flatMap((permission) =>
      permission.kind === 'network' ? permission.hosts : [],
    ),
  );

  const allowed = (image: ImageRef | undefined): boolean =>
    image === undefined ||
    (image.kind === 'asset' && assets.has(image.name)) ||
    image.kind === 'media' ||
    (image.kind === 'remote' && hosts.has(new URL(image.url).hostname));

  const tidy = (blocks: readonly SurfaceBlock[]): SurfaceBlock[] =>
    blocks.flatMap((block): SurfaceBlock[] => {
      switch (block.type) {
        case 'image':
          return allowed(block.image) ? [block] : [];
        case 'row':
          return [allowed(block.image) ? block : { ...block, image: undefined }];
        case 'list':
          return [
            {
              ...block,
              rows: block.rows.map((row) =>
                allowed(row.image) ? row : { ...row, image: undefined },
              ),
            },
          ];
        case 'section':
          return [{ ...block, children: tidy(block.children) }];
        case 'heading':
        case 'text':
        case 'notice':
        case 'button':
        case 'toggle':
        case 'textField':
        case 'select':
        case 'progress':
        case 'link':
        case 'media':
        case 'divider':
          return [block];
      }
    });

  let read: ReturnType<typeof SurfaceSchema.safeParse>;

  try {
    read = SurfaceSchema.safeParse(JSON.parse(text));
  } catch {
    return {
      surface: NOT_SHOWN,
      problem: saying('server.surfaces.cleanSurface.thePluginAnsweredWithSomethingThat'),
    };
  }

  if (!read.success) {
    return {
      surface: NOT_SHOWN,
      problem: sayVerbatim(
        read.error.issues
          .slice(0, 3)
          .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
          .join('; '),
      ),
    };
  }

  return { surface: { ...read.data, blocks: tidy(read.data.blocks) }, problem: null };
};

export { cleanSurface };
