type BookTextProps = {
  html: string;
  onFollow: (place: { part: number; anchor: string | null }) => void;
};

export type { BookTextProps };
