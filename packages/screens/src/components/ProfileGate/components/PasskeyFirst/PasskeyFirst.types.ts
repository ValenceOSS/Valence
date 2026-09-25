type PasskeyFirstProps = {
  name: string;
  isUsingPasskey: boolean;
  problem: string | null;
  onPasskey: (isQuiet: boolean) => void;
  onOtherWays: () => void;
};

export type { PasskeyFirstProps };
