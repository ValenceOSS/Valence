type ServerChoice = {
  address: string;
  label: string;
  detail?: string;
};

type ServerChoicesProps = {
  title: string;
  choices: readonly ServerChoice[];
  onChoose: (address: string) => void;
  isDisabled?: boolean;
};

export type { ServerChoice, ServerChoicesProps };
