import { z } from 'zod';
import { PluginManifestSchema } from '@ValenceSDK/manifest/PluginManifestSchema';
import { PACKAGE_LIMITS } from './PACKAGE_LIMITS';

const PluginPackageSchema = z
  .object({
    format: z.literal(1),
    manifest: PluginManifestSchema,
    code: z.string().max(PACKAGE_LIMITS.codeBytes).optional(),
    assets: z
      .record(
        z.string().regex(/^[a-z0-9-]+\.(png|jpg|webp)$/),
        z
          .string()
          .regex(/^[A-Za-z0-9+/]+={0,2}$/)
          .max(Math.ceil(PACKAGE_LIMITS.assetBytes / 3) * 4),
      )
      .refine((assets) => Object.keys(assets).length <= PACKAGE_LIMITS.assets, 'Too many assets')
      .default({}),
  })
  .superRefine((plugin, context) => {
    if ((plugin.manifest.entry === undefined) !== (plugin.code === undefined)) {
      context.addIssue({
        code: 'custom',
        path: ['code'],
        message: 'A package carries code exactly when its manifest names an entry',
      });
    }

    const icon = plugin.manifest.icon;

    if (icon !== undefined && !(icon in plugin.assets)) {
      context.addIssue({
        code: 'custom',
        path: ['assets'],
        message: `The icon ${icon} is not packed`,
      });
    }
  });

type PluginPackage = z.infer<typeof PluginPackageSchema>;

export type { PluginPackage };

export { PluginPackageSchema };
