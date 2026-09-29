type ASelectBlockProps = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChoose: (value: string) => void;
};

export type { ASelectBlockProps };
