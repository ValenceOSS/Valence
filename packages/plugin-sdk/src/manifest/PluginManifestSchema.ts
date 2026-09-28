import { z } from 'zod';
import { ContributionsSchema } from './ContributionsSchema';
import { HttpsUrlSchema } from './HttpsUrlSchema';
import { PermissionSchema } from './PermissionSchema';

const SEMVER = /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/;

const SEMVER_RANGE = /^[\^~]?\d+(\.\d+){0,2}$/;

const PluginManifestSchema = z
  .object({
    manifestVersion: z.literal(2),
    id: z
      .string()
      .min(3)
      .max(64)
      .regex(/^[a-z][a-z0-9-]*$/, 'Plugin ids are lower-case kebab-case'),
    name: z.string().min(1).max(60),
    version: z.string().regex(SEMVER, 'A plugin version is a full semver version'),
    apiVersion: z.string().regex(SEMVER_RANGE, 'apiVersion is a semver range such as ^1.0'),
    author: z.object({ name: z.string().min(1).max(80), url: HttpsUrlSchema.optional() }),
    description: z.string().min(1).max(500),
    homepage: HttpsUrlSchema.optional(),
    icon: z.string().regex(/^[a-z0-9-]+\.(png|jpg|webp)$/).optional(),
    permissions: z.array(PermissionSchema).max(16).default([]),
    contributes: ContributionsSchema.default({
      pages: [],
      panels: [],
      themes: [],
      schedules: [],
      events: [],
    }),
    entry: z.string().regex(/^[a-z0-9/_-]+\.js$/).optional(),
    settings: z
      .array(
        z.object({
          id: z.string().regex(/^[a-z][a-zA-Z0-9]{0,39}$/),
          label: z.string().min(1).max(60),
          kind: z.enum(['text', 'secret', 'toggle']),
          help: z.string().max(200).optional(),
        }),
      )
      .max(16)
      .default([]),
  })
  .superRefine((manifest, context) => {
    const kinds = manifest.permissions.map((permission) => permission.kind);
    const network = manifest.permissions.flatMap((permission) =>
      permission.kind === 'network' ? permission.hosts : [],
    );
    const runs =
      manifest.contributes.pages.length > 0 ||
      manifest.contributes.panels.length > 0 ||
      manifest.contributes.schedules.length > 0 ||
      manifest.contributes.events.length > 0 ||
      manifest.permissions.length > 0;

    if (new Set(kinds).size !== kinds.length) {
      context.addIssue({ code: 'custom', message: 'Each permission is declared once' });
    }

    if (runs && manifest.entry === undefined) {
      context.addIssue({
        code: 'custom',
        path: ['entry'],
        message: 'A plugin with pages, panels, schedules, events or permissions names its entry',
      });
    }

    for (const permission of manifest.permissions) {
      if (permission.kind !== 'accounts') {
        continue;
      }

      for (const provider of permission.providers) {
        for (const address of [provider.authorizeUrl, provider.tokenUrl]) {
          if (!network.includes(new URL(address).hostname)) {
            context.addIssue({
              code: 'custom',
              path: ['permissions'],
              message: `${new URL(address).hostname} is used by ${provider.name} but not listed under network`,
            });
          }
        }

        for (const setting of [provider.clientIdSetting, provider.clientSecretSetting]) {
          if (setting !== undefined && !manifest.settings.some((each) => each.id === setting)) {
            context.addIssue({
              code: 'custom',
              path: ['settings'],
              message: `${provider.name} reads the setting ${setting}, which is not declared`,
            });
          }
        }
      }
    }

    const ids = [
      ...manifest.contributes.pages.map((page) => `page:${page.id}`),
      ...manifest.contributes.panels.map((panel) => `panel:${panel.id}`),
      ...manifest.contributes.themes.map((theme) => `theme:${theme.id}`),
      ...manifest.contributes.schedules.map((schedule) => `schedule:${schedule.id}`),
    ];

    if (new Set(ids).size !== ids.length) {
      context.addIssue({ code: 'custom', message: 'Each contribution id is used once' });
    }
  });

type PluginManifest = z.infer<typeof PluginManifestSchema>;

type PluginManifestInput = z.input<typeof PluginManifestSchema>;

export type { PluginManifest, PluginManifestInput };

export { PluginManifestSchema };
