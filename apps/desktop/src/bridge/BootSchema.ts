import { z } from 'zod';
import { DesktopUpdateSchema } from '@ValenceContracts/schemas/DesktopUpdate';
import { NearbyValenceSchema } from '@ValenceContracts/schemas/NearbyValence';
import { WindowFrameSchema } from '@ValenceContracts/schemas/WindowFrame';

const HeldSchema = z.record(z.string(), z.string()).catch({});

const AboutSchema = z.object({
  version: z.string().catch(''),
  isADevBuild: z.boolean().catch(false),
  computerName: z.string().nullable().catch(null),
  commit: z.string().catch(''),
  arch: z.string().catch(''),
  platform: z.string().catch(''),
  webview: z.string().catch(''),
  tauri: z.string().catch(''),
});

const BootFieldsSchema = z.object({
  preferences: HeldSchema,
  thisLaunch: HeldSchema,
  alreadyFound: z.array(z.string()).catch([]),
  alreadyNearby: z.array(NearbyValenceSchema).catch([]),
  update: DesktopUpdateSchema.catch({ kind: 'none' }),
  frame: WindowFrameSchema.catch({ isMaximised: false, isFullScreen: false }),
  isReachable: z.boolean().catch(true),
  about: AboutSchema.catch(() => AboutSchema.parse({})),
  passkeyWay: z.enum(['system', 'page']).catch('page'),
});

const BootSchema = BootFieldsSchema.catch(() => BootFieldsSchema.parse({}));

type Boot = z.infer<typeof BootSchema>;

export type { Boot };

export { BootSchema };
