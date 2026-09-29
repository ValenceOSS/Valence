import { z } from 'zod';
import { PermissionSchema as PluginPermissionSchema } from '@ValenceSDK/manifest/PermissionSchema';
import { PluginNodeSchema } from './Permission';
import { IconNameSchema } from '@ValenceSDK/surface/IconNameSchema';
import { PluginThemeSchema } from '@ValenceSDK/theme/PluginThemeSchema';
import { SurfaceSchema } from '@ValenceSDK/surface/SurfaceSchema';

const PluginTrustSchema = z.enum(['official', 'unsigned']);

const PluginSettingSchema = z.object({
  id: z.string(),
  label: z.string(),
  kind: z.enum(['text', 'secret', 'toggle']),
  help: z.string().nullable(),
  value: z.union([z.string(), z.boolean()]).nullable(),
  isSet: z.boolean(),
});

const PluginSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  version: z.string(),
  description: z.string(),
  author: z.string(),
  homepage: z.string().nullable(),
  iconUrl: z.string().nullable(),
  trust: PluginTrustSchema,
  permissions: z.array(PluginPermissionSchema),
  pages: z.array(
    z.object({ id: z.string(), title: z.string(), placement: z.enum(['account', 'admin']) }),
  ),
  panels: z.array(z.object({ id: z.string(), title: z.string(), on: z.string() })),
  themes: z.array(z.object({ id: z.string(), name: z.string() })),
  schedules: z.array(z.object({ id: z.string(), label: z.string(), everyMinutes: z.number() })),
  events: z.array(z.string()),
});

const InstalledPluginSchema = PluginSummarySchema.extend({
  isEnabled: z.boolean(),
  state: z.enum(['running', 'stopped', 'failed', 'idle']),
  problem: z.string().nullable(),
  settings: z.array(PluginSettingSchema),
  installedAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  updateAvailable: z.string().nullable(),
  previousVersion: z.string().nullable(),
  webhooks: z.array(z.object({ id: z.string(), title: z.string(), url: z.string() })),
});

const InstalledPluginsSchema = z.object({
  plugins: z.array(InstalledPluginSchema),
  redirectUri: z.string().nullable(),
});

const CatalogueListingSchema = z.object({
  isReachable: z.boolean(),
  problem: z.string().nullable(),
  plugins: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string(),
      author: z.string(),
      version: z.string(),
      kinds: z.array(z.enum(['extension', 'theme'])),
      permissions: z.array(PluginPermissionSchema),
      iconUrl: z.string().nullable(),
      sourceUrl: z.string(),
      installedVersion: z.string().nullable(),
      isCompatible: z.boolean(),
    }),
  ),
});

const InstallPreviewSchema = z.object({
  token: z.string(),
  permissionsHash: z.string(),
  plugin: PluginSummarySchema,
  trust: PluginTrustSchema,
  warnings: z.array(z.string()),
  replacesVersion: z.string().nullable(),
});

const PluginContributionsSchema = z.object({
  pages: z.array(
    z.object({
      pluginId: z.string(),
      pluginName: z.string(),
      pageId: z.string(),
      title: z.string(),
      placement: z.enum(['account', 'admin']),
      icon: IconNameSchema.nullable(),
    }),
  ),
  panels: z.array(
    z.object({
      pluginId: z.string(),
      pluginName: z.string(),
      panelId: z.string(),
      title: z.string(),
      on: z.enum(['title', 'series', 'album', 'artist', 'playlist']),
    }),
  ),
  themes: z.array(
    PluginThemeSchema.and(z.object({ pluginId: z.string(), pluginName: z.string() })),
  ),
  nodes: z.array(
    z.object({
      node: PluginNodeSchema,
      pluginId: z.string(),
      pluginName: z.string(),
      title: z.string(),
      description: z.string().nullable(),
    }),
  ),
});

const PluginRemovalSchema = z.object({
  bytesKept: z.number().int().nonnegative(),
  people: z.number().int().nonnegative(),
  accounts: z.array(
    z.object({
      provider: z.string(),
      connected: z.number().int().positive(),
      isRevoked: z.boolean(),
    }),
  ),
  themes: z.number().int().nonnegative(),
  nodes: z.number().int().nonnegative(),
  webhooks: z.number().int().nonnegative(),
  keepsEarlierVersion: z.boolean(),
});

const PluginChangeSchema = z.object({
  pluginId: z.string(),
  change: z.enum(['installed', 'updated', 'enabled', 'disabled', 'settings', 'removed']),
});

const PluginActAnswerSchema = z.object({
  surface: SurfaceSchema.nullable(),
  navigate: z.string().nullable(),
});

type PluginTrust = z.infer<typeof PluginTrustSchema>;
type InstalledPlugins = z.infer<typeof InstalledPluginsSchema>;
type PluginChange = z.infer<typeof PluginChangeSchema>;
type PluginSetting = z.infer<typeof PluginSettingSchema>;
type PluginSummary = z.infer<typeof PluginSummarySchema>;
type InstalledPlugin = z.infer<typeof InstalledPluginSchema>;
type CatalogueListing = z.infer<typeof CatalogueListingSchema>;
type InstallPreview = z.infer<typeof InstallPreviewSchema>;
type PluginContributions = z.infer<typeof PluginContributionsSchema>;

type PluginRemoval = z.infer<typeof PluginRemovalSchema>;
type PluginActAnswer = z.infer<typeof PluginActAnswerSchema>;

export type {
  CatalogueListing,
  PluginActAnswer,
  PluginChange,
  InstalledPlugin,
  InstalledPlugins,
  InstallPreview,
  PluginContributions,
  PluginRemoval,
  PluginSetting,
  PluginSummary,
  PluginTrust,
};

export {
  CatalogueListingSchema,
  PluginActAnswerSchema,
  PluginChangeSchema,
  InstalledPluginSchema,
  InstalledPluginsSchema,
  InstallPreviewSchema,
  PluginContributionsSchema,
  PluginRemovalSchema,
  PluginSettingSchema,
  PluginSummarySchema,
  PluginTrustSchema,
};
