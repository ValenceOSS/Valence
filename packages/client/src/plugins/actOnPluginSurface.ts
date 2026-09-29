import { z } from 'zod';
import { changeOnServer } from '@ValenceClient/query/changeOnServer';
import { profileHeaders } from '@ValenceClient/profiles/currentProfile';
import { surfacePathOf } from '@ValenceClient/plugins/surfacePathOf';
import { PluginActAnswerSchema } from '@ValenceContracts/schemas/Plugin';
import type { SurfaceActRequest } from '@ValenceSDK/surface/SurfaceActRequestSchema';
import type { PluginPlace } from '@ValenceClient/plugins/PluginPlace';
import type { SurfaceAnswer } from '@ValenceClient/plugins/SurfaceAnswer';

const PluginPathSchema = z
  .string()
  .regex(/^\/api\/plugins\/[^/?#]+\//u, 'Only this server’s own plugin addresses are followed')
  .refine(
    (to) => !to.includes('//') && !to.includes('\\'),
    'Only a path on this server is followed',
  );

/**
 * Tells a plugin somebody pressed something on its page or panel, with what they had filled in.
 *
 * The answer is a new surface, nothing where the page stays as it was, or, for connecting an
 * account, an address on this server to send the browser to. Only a path under this server's own
 * plugin addresses is ever followed, so a plugin cannot send anybody anywhere else.
 *
 * @param place - Which page or panel.
 * @param request - The action and the fields.
 * @returns What the server answered.
 * @throws With the server's words where it refused.
 */
const actOnPluginSurface = async (
  place: PluginPlace,
  request: SurfaceActRequest,
): Promise<SurfaceAnswer> => {
  const answer = await changeOnServer(
    surfacePathOf(place, true),
    {
      method: 'POST',
      headers: profileHeaders(),
      json: {
        action: {
          id: request.action.id,
          ...(request.action.payload === undefined ? {} : { payload: request.action.payload }),
        },
        fields: request.fields,
      },
    },
    'The plugin could not do that.',
  );

  const read = PluginActAnswerSchema.parse(answer);

  if (read.navigate !== null) {
    return { kind: 'navigate', to: PluginPathSchema.parse(read.navigate) };
  }

  return read.surface === null ? { kind: 'unchanged' } : { kind: 'surface', surface: read.surface };
};

export { actOnPluginSurface };
