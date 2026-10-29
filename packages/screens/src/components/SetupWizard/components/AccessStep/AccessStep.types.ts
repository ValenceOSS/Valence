type AccessStepProps = {
  detectedOrigin: string;
  suggestedOrigins: readonly string[];
  origins: readonly string[];
  onOriginsChange: (origins: string[]) => void;
  cookieSecure: boolean;
  onCookieSecureChange: (cookieSecure: boolean) => void;
  sharesUsageStatistics: boolean;
  onSharesUsageStatisticsChange: (sharesUsageStatistics: boolean) => void;
  isTelemetryOffByEnvironment: boolean;
  isCreating: boolean;
  problem: string | null;
  onBack: () => void;
  onCreate: () => void;
};

export type { AccessStepProps };
