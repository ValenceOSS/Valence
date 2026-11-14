import { JELLYFIN_VERSION } from '@ValenceServer/jellyfin/JELLYFIN_VERSION';
import { JELLYFIN_BASE_PATH } from '@ValenceServer/jellyfin/JELLYFIN_BASE_PATH';
import type { JellyfinApp } from '@ValenceServer/jellyfin/JellyfinApp';
import type { JellyfinBackend } from '@ValenceServer/jellyfin/JellyfinBackend';
import type { JellyfinPublicInfo } from '@ValenceServer/jellyfin/JellyfinDtos';

// oxlint-disable-next-line valence/no-hard-coded-strings -- the product name Jellyfin's apps check for, not words for a person
const PRODUCT_NAME = 'Jellyfin Server';

const MOST_TEST_BYTES = 10_000_000;

/**
 * Registers what Jellyfin's apps ask before anybody signs in, when a server is being added: who it
 * is and which version of Jellyfin it answers as, that it is set up, how its sign-in page looks, and
 * that it has no quick connect and lists nobody publicly.
 *
 * @param jellyfin - The Jellyfin endpoints.
 * @param backend - What they are answered with.
 */
const registerJellyfinSystem = (jellyfin: JellyfinApp, backend: JellyfinBackend): void => {
  const publicInfo = async (url: string): Promise<JellyfinPublicInfo> => ({
    LocalAddress: `${new URL(url).origin}${JELLYFIN_BASE_PATH}`,
    ServerName: await backend.serverName(),
    Version: JELLYFIN_VERSION,
    ProductName: PRODUCT_NAME,
    OperatingSystem: '',
    Id: await backend.serverId(),
    StartupWizardCompleted: true,
  });

  jellyfin.get('/system/info/public', async (context) =>
    context.json(await publicInfo(context.get('origin').url)),
  );

  jellyfin.get('/system/info', async (context) => {
    if (context.get('caller') === null) {
      return context.body(null, 401);
    }

    return context.json({
      ...(await publicInfo(context.get('origin').url)),
      OperatingSystemDisplayName: '',
      HasPendingRestart: false,
      IsShuttingDown: false,
      SupportsLibraryMonitor: false,
      WebSocketPortNumber: 0,
      CompletedInstallations: [],
      CanSelfRestart: false,
      CanLaunchWebBrowser: false,
      HasUpdateAvailable: false,
      TranscodingTempPath: '',
      CastReceiverApplications: [],
      LogPath: '',
      InternalMetadataPath: '',
      CachePath: '',
      ProgramDataPath: '',
      ItemsByNamePath: '',
      WebPath: '',
      // oxlint-disable-next-line valence/no-hard-coded-strings -- a Jellyfin system field value its apps read, not words for a person
      EncoderLocation: 'System',
      SystemArchitecture: 'X64',
    });
  });

  jellyfin.on(['GET', 'POST'], '/system/ping', (context) => context.json(PRODUCT_NAME));

  jellyfin.get('/system/endpoint', (context) =>
    context.json({ IsLocal: false, IsInNetwork: false }),
  );

  jellyfin.get('/branding/configuration', (context) =>
    context.json({ LoginDisclaimer: '', CustomCss: '', SplashscreenEnabled: false }),
  );

  jellyfin.get('/branding/css', (context) => context.body('', 200, { 'content-type': 'text/css' }));

  jellyfin.get('/branding/css.css', (context) =>
    context.body('', 200, { 'content-type': 'text/css' }),
  );

  jellyfin.get('/users/public', (context) => context.json([]));

  jellyfin.get('/quickconnect/enabled', (context) => context.json(false));

  jellyfin.get('/playback/bitratetest', (context) => {
    if (context.get('caller') === null) {
      return context.body(null, 401);
    }

    const asked = Number(context.get('query')['size'] ?? '0');
    const size = Number.isInteger(asked) && asked > 0 ? Math.min(asked, MOST_TEST_BYTES) : 0;

    return context.body(new Uint8Array(size), 200, {
      'content-type': 'application/octet-stream',
    });
  });
};

export { registerJellyfinSystem };
