import type { InstallPreview } from '@ValenceContracts/schemas/Plugin';
import { InstallReview } from '@ValenceScreens/components/AdminArea/components/PluginsPanel/components/InstallReviewDialog/components/InstallReview/InstallReview';
import { nothing } from '@ValenceLanding/components/HomePage/components/FeatureCard/components/FeatureVisual/nothing';
import type { PluginsPictureProps } from './PluginsPicture.types';

const PREVIEW: InstallPreview = {
  token: 'lyrics',
  permissionsHash: 'lyrics',
  trust: 'unsigned',
  warnings: [],
  replacesVersion: null,
  plugin: {
    id: 'lyrics',
    name: 'Lyrics',
    version: '1.4.0',
    description: 'Words for every song, in time with it.',
    author: 'Sam',
    homepage: null,
    iconUrl: null,
    trust: 'unsigned',
    permissions: [
      { kind: 'network', hosts: ['lyrics.example'] },
      { kind: 'library', access: 'read' },
    ],
    pages: [],
    panels: [],
    themes: [],
    schedules: [],
    events: [],
    downloadClients: [],
    sources: [],
  },
};

/**
 * The app's own last look before a plugin nobody vouches for is installed, saying what it may touch;
 * pointed at, its risk is understood and it can be installed anyway.
 *
 * @param isUnderstood - Whether the risk has been understood.
 */
const PluginsPicture = ({ isUnderstood = false }: PluginsPictureProps) => (
  <div className="absolute -bottom-4 left-6 w-[36rem] text-left">
    <div className="valence-card-shell flex flex-col rounded-2xl p-1 shadow-[var(--shadow-lifted)]">
      <div className="valence-card-face flex flex-col overflow-hidden rounded-xl">
        <InstallReview
          preview={PREVIEW}
          isUnderstood={isUnderstood}
          onUnderstood={nothing}
          isInstalling={false}
          onCancel={nothing}
          onInstall={nothing}
        />
      </div>
    </div>
  </div>
);

PluginsPicture.displayName = 'PluginsPicture';

export { PluginsPicture };
