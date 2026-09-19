type TryVerdict = 'working' | 'failing' | null;

type TryItButtonProps = {
  isTrying: boolean;
  verdict: TryVerdict;
  isDisabled?: boolean;
  onTry: () => void;
};

export type { TryItButtonProps, TryVerdict };
