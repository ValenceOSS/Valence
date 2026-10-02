type StarChoiceProps = {
  title: string;
  given: number | null;
  onChoose: (stars: number | null) => void;
};

export type { StarChoiceProps };
