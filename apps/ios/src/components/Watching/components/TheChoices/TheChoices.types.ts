type AChoice = {
  id: string;
  label: string;
  detail?: string;
};

type ASetOfChoices = {
  heading: string;
  choices: readonly AChoice[];
  chosen: string;
  onChoose: (id: string) => void;
};

type TheChoicesProps = {
  sets: readonly ASetOfChoices[];
  onClose: () => void;
};

export type { AChoice, ASetOfChoices, TheChoicesProps };
