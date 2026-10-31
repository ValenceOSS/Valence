import type { InstalledRecord } from '@ValenceServer/plugins/store/PluginStore';

/**
 * The routes of a plugin that people sign apps in to with an app password: those of a plugin given
 * the routes permission that take any way of signing in other than being public.
 *
 * @param record - The installed plugin.
 * @returns Those routes.
 */
const routesTakingAppPasswords = (record: InstalledRecord) =>
  record.manifest.permissions.some((permission) => permission.kind === 'routes')
    ? record.manifest.contributes.routes.filter((route) =>
        route.signIn.some((signIn) => signIn.kind !== 'public'),
      )
    : [];

export { routesTakingAppPasswords };
