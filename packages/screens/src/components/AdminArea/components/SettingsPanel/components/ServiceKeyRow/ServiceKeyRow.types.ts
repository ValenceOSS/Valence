type ServiceKeyRowProps = {
  title: string;
  about: string;
  description: string;
  isSet: boolean;
  freeKeyAt?: string;
  save: (key: string) => Promise<boolean>;
  done: string;
  failed: string;
  onSaved: () => void;
};

export type { ServiceKeyRowProps };
