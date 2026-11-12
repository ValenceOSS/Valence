type ATextChoice = { id: string; label: string };

type ATextSettingsProps = {
  isScrolling: boolean;
  onScrolling: (isScrolling: boolean) => void;
  isAnimated: boolean;
  onAnimated: (isAnimated: boolean) => void;
  spacings: readonly ATextChoice[];
  spacing: string;
  onSpacing: (spacing: string) => void;
  margins: readonly ATextChoice[];
  margin: string;
  onMargin: (margin: string) => void;
};

export type { ATextChoice, ATextSettingsProps };
