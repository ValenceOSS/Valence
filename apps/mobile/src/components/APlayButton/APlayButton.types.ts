type APlayButtonProps = {
  says: string;
  onPress: () => void;
  watched?: number | null;
  onStartAgain?: () => void;
};

export type { APlayButtonProps };
