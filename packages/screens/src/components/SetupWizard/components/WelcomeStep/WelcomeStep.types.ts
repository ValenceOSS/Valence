type WelcomeStepProps = {
  language: string;
  onLanguageChange: (language: string) => void;
  setupCode: string;
  onSetupCodeChange: (code: string) => void;
  problem: string | null;
  onBegin: () => void;
};

export type { WelcomeStepProps };
