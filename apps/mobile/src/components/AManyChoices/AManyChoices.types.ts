type AManyChoicesProps = {
  label: string;
  choices: readonly { id: string; label: string }[];
  chosen: readonly string[];
  onChange: (chosen: string[]) => void;
};

export type { AManyChoicesProps };
