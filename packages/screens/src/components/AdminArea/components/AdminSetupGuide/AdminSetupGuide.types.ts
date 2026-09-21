type AdminSetupGuideProps = {
  hasLibrary: boolean;
  hasCatalogueKey: boolean;
  hasScanned: boolean;
  isScanning?: boolean;
  onAddLibrary: () => void;
  onOpenSettings: () => void;
  onScanAll: () => void;
  onHide: () => void;
};

export type { AdminSetupGuideProps };
