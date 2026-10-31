type SecretShownOnceProps = {
  warning: string;
  details: readonly { id: string; name: string | null; value: string }[];
  copied: string | null;
  onCopy: (id: string, value: string) => void;
};

export type { SecretShownOnceProps };
