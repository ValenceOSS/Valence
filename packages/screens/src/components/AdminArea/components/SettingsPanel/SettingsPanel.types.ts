import type { AdminOverview } from '@ValenceClient/admin/fetchAdmin';

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
  onSplashscreenSaved: () => void;
};

export type { SettingsPanelProps };
