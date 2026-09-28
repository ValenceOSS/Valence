import { askToConfirmOnTv } from '@ValenceTv/plugins/askToConfirmOnTv';
import type { PluginSurfaceHost } from '@ValenceClient/plugins/usePluginSurface';

const TV_SURFACE_HOST: PluginSurfaceHost = {
  askToConfirm: askToConfirmOnTv,
  openOnServer: () =>
    Promise.reject(
      new Error(
        'A television has no browser. Connect this on your phone or on the web, then come back.',
      ),
    ),
};

export { TV_SURFACE_HOST };
