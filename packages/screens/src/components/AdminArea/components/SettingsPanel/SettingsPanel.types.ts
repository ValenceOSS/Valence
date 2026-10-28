import type { AdminOverview } from '@ValenceClient/admin/fetchAdmin';
import type { PlacedDevice } from '@ValenceContracts/schemas/TranscodeDevice';

type SettingsPanelProps = {
  overview: AdminOverview | null;
  onCatalogueKeySaved: () => void;
  onHardwareAccelSaved: () => void;
  onPreviewQualitySaved: () => void;
  onCertificationRegionSaved: () => void;
  onProfileVisibilitySaved: () => void;
  onCatalogueTrailersSaved: () => void;
  onMusicDetailsSaved?: () => void;
  onReleaseTypesSaved?: () => void;
  onRoundnessSaved?: () => void;
  onSplashscreenSaved: () => void;
  devices?: PlacedDevice[] | null;
  onDevicesSaved?: () => void;
};

export type { SettingsPanelProps };
