type WelcomeStepProps = {
  setupCode: string;
  onSetupCodeChange: (code: string) => void;
  problem: string | null;
  onBegin: () => void;
};

export type { WelcomeStepProps };
