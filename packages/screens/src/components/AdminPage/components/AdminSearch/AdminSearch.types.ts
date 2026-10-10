type AdminSearchSection = {
  label: string | null;
  items: readonly { id: string; label: string }[];
};

type AdminSearchProps = {
  sections: readonly AdminSearchSection[];
  isCompact: boolean;
  onGo: (id: string) => void;
};

export type { AdminSearchProps, AdminSearchSection };
