type SavedSettingOptions = {
  done: string;
  failed: string;
  delayMs?: number;
  onSaved?: () => void;
  tells?: (isSaved: boolean) => void;
};

export type { SavedSettingOptions };
