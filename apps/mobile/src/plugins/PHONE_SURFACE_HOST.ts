import { askBeforeActing } from '@ValenceMobile/plugins/askBeforeActing';
import { openOnThePhone } from '@ValenceMobile/plugins/openOnThePhone';
import type { PluginSurfaceHost } from '@ValenceClient/plugins/usePluginSurface';

const PHONE_SURFACE_HOST: PluginSurfaceHost = {
  askToConfirm: askBeforeActing,
  openOnServer: openOnThePhone,
};

export { PHONE_SURFACE_HOST };
